<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="surface" elevation="0" border="b">
      <v-app-bar-nav-icon class="d-lg-none" @click="drawer = !drawer" />

      <v-app-bar-title class="font-weight-bold">
        <router-link to="/" class="text-decoration-none" style="color: inherit;">
          <span class="text-primary">Model</span>Stack
        </router-link>
      </v-app-bar-title>

      <v-tabs v-if="!isConsolePage" v-model="activeTab" class="ml-6 d-none d-lg-flex" color="primary">
        <v-tab value="home" to="/">
          <v-icon start>mdi-home</v-icon>
          首页
        </v-tab>
        <v-tab value="models" to="/models">
          <v-icon start>mdi-cube-outline</v-icon>
          模型广场
        </v-tab>
      </v-tabs>

      <v-spacer />

      <v-btn icon variant="text" class="mr-2">
        <v-icon>mdi-github</v-icon>
      </v-btn>
      <v-btn icon variant="text" @click="toggleTheme" class="mr-2">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      
      <!-- 登录状态显示 -->
      <template v-if="userStore.isLoggedIn">
        <!-- 非控制台页面显示控制台按钮 -->
        <v-btn v-if="!isConsolePage" variant="tonal" color="primary" to="/console" rounded="lg" class="mr-2">
          <v-icon start>mdi-console</v-icon>
          控制台
        </v-btn>
        <!-- 用户菜单 -->
        <!-- <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" rounded="lg">
              <v-icon start>mdi-account-circle</v-icon>
              {{ userStore.displayName }}
              <v-icon end>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-if="!isConsolePage" to="/console" prepend-icon="mdi-console">
              <v-list-item-title>控制台</v-list-item-title>
            </v-list-item>
            <v-divider v-if="!isConsolePage" />
            <v-list-item @click="handleLogout" prepend-icon="mdi-logout" class="text-error">
              <v-list-item-title>退出登录</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu> -->
      </template>
      <template v-else>
        <v-btn variant="tonal" color="primary" to="/login" rounded="lg">
          <v-icon start>mdi-login</v-icon>
          登录
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary class="d-lg-none">
      <v-list nav>
        <template v-if="!isConsolePage">
          <v-list-item prepend-icon="mdi-home" title="首页" to="/" />
          <v-list-item prepend-icon="mdi-cube-outline" title="模型广场" to="/models" />
          <v-divider class="my-2" />
        </template>
        <template v-if="userStore.isLoggedIn">
          <v-list-item prepend-icon="mdi-console" title="控制台" to="/console" />
          <v-list-item prepend-icon="mdi-logout" title="退出登录" @click="handleLogout" class="text-error" />
        </template>
        <template v-else>
          <v-list-item prepend-icon="mdi-login" title="登录" to="/login" />
          <v-list-item prepend-icon="mdi-account-plus" title="注册" to="/register" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <router-view />
    </v-main>

    <!-- 全局 Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { API, loadSystemStatus } from '@/utils/api'

const drawer = ref(false)
const theme = useTheme()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isDark = computed(() => theme.global.current.value.dark)

const isConsolePage = computed(() => route.path.startsWith('/console'))

const activeTab = computed(() => {
  if (route.path === '/') return 'home'
  if (route.path.startsWith('/models')) return 'models'
  return 'home'
})

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

function showMessage(text: string, color = 'success') {
  snackbar.value = { show: true, text, color }
}

// 退出登录
async function handleLogout() {
  try {
    await API.get('/api/user/logout')
  } catch (error) {
    console.error('Logout API error:', error)
  }

  userStore.logout()
  showMessage('已退出登录', 'success')
  drawer.value = false
  router.push('/')
}

// 初始化加载系统状态
onMounted(async () => {
  await loadSystemStatus()
})
</script>

<style>
.v-app-bar-title {
  flex: none !important;
}
</style>
