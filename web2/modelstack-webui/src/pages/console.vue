<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <!-- 左侧菜单 Sidebar -->
      <v-col cols="auto" class="d-none d-md-flex">
        <v-navigation-drawer permanent width="240" class="border-e">
          <v-list nav density="compact" class="pa-2">
            <v-list-subheader class="text-caption font-weight-bold">
              控制台
            </v-list-subheader>
            
            <v-list-item
              v-for="item in menuItems"
              :key="item.value"
              :prepend-icon="item.icon"
              :title="item.title"
              :value="item.value"
              :active="activeMenu === item.value"
              @click="activeMenu = item.value"
              rounded="lg"
              class="mb-1"
            />

            <v-divider class="my-2" />

            <!-- 用户信息 -->
            <v-list-item
              prepend-icon="mdi-account-circle"
              :title="userStore.displayName"
              :subtitle="userStore.username"
            />

            <!-- 退出登录 -->
            <v-list-item
              prepend-icon="mdi-logout"
              title="退出登录"
              @click="handleLogout"
              rounded="lg"
              class="text-error"
            />
          </v-list>
        </v-navigation-drawer>
      </v-col>

      <!-- 移动端底部导航 -->
      <v-bottom-navigation v-model="activeMenu" grow class="d-md-none">
        <v-btn v-for="item in menuItems" :key="item.value" :value="item.value">
          <v-icon>{{ item.icon }}</v-icon>
          <span class="text-caption">{{ item.title }}</span>
        </v-btn>
        <v-btn value="logout" @click="handleLogout">
          <v-icon>mdi-logout</v-icon>
          <span class="text-caption">退出</span>
        </v-btn>
      </v-bottom-navigation>

      <!-- 右侧内容区 -->
      <v-col class="fill-height overflow-auto">
        <v-container fluid class="pa-4 pa-md-6">
          <!-- 令牌管理页面 -->
          <TokenManagement v-if="activeMenu === 'tokens'" />
          
          <!-- 其他页面占位 -->
          <div v-else class="text-center py-16">
            <v-icon size="64" color="grey-lighten-1">{{ currentMenuItem?.icon }}</v-icon>
            <h3 class="text-h6 mt-4 text-medium-emphasis">{{ currentMenuItem?.title }}</h3>
            <p class="text-body-2 text-disabled">功能开发中...</p>
          </div>
        </v-container>
      </v-col>
    </v-row>

    <!-- 退出确认对话框 -->
    <v-dialog v-model="logoutDialog" max-width="400">
      <v-card>
        <v-card-title>确认退出</v-card-title>
        <v-card-text>确定要退出登录吗？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="logoutDialog = false">取消</v-btn>
          <v-btn color="error" variant="tonal" @click="confirmLogout">退出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { API } from '@/utils/api'
import TokenManagement from '@/components/console/TokenManagement.vue'

const router = useRouter()
const userStore = useUserStore()

const activeMenu = ref('tokens')
const logoutDialog = ref(false)

const menuItems = [
  { title: '令牌管理', value: 'tokens', icon: 'mdi-key-variant' },
  { title: '使用记录', value: 'logs', icon: 'mdi-history' },
  { title: '数据统计', value: 'stats', icon: 'mdi-chart-bar' },
  { title: '个人设置', value: 'settings', icon: 'mdi-cog' },
]

const currentMenuItem = computed(() => {
  return menuItems.find(item => item.value === activeMenu.value)
})

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
function handleLogout() {
  logoutDialog.value = true
}

async function confirmLogout() {
  try {
    // 调用后端登出接口
    await API.get('/api/user/logout')
  } catch (error) {
    // 即使后端调用失败，也继续清理前端状态
    console.error('Logout API error:', error)
  }

  // 清理用户状态
  userStore.logout()
  logoutDialog.value = false
  showMessage('已退出登录', 'success')

  // 跳转到首页
  router.push('/')
}

// 组件挂载时检查登录状态并获取用户信息
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.replace('/login')
    return
  }
  
  // 获取最新的用户信息
  await userStore.fetchUserSelf()
})
</script>

<style scoped>
.fill-height {
  height: 100%;
  min-height: calc(100vh - 64px);
}
</style>
