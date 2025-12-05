<template>
    <div class="console-layout fill-height">
        <!-- 左侧菜单 Sidebar - 响应式 -->
        <v-navigation-drawer v-model="drawer" :permanent="!mobile" :temporary="mobile" width="240" class="border-e">
            <v-list nav density="compact" class="pa-2 d-flex flex-column fill-height">
                <v-list-subheader class="text-caption font-weight-bold">
                    控制台
                </v-list-subheader>

                <v-list-item v-for="item in menuItems" :key="item.value" :prepend-icon="item.icon" :title="item.title"
                    :value="item.value" :to="item.to" rounded="lg" class="mb-1" @click="mobile && (drawer = false)" />

                <v-spacer />

                <div>
                    <v-divider class="my-2" />

                    <!-- 用户信息 -->
                    <v-list-item prepend-icon="mdi-account-circle" :title="userStore.displayName"
                        :subtitle="userStore.username" />

                    <!-- 退出登录 -->
                    <v-list-item prepend-icon="mdi-logout" title="退出登录" @click="handleLogout" rounded="lg"
                        class="text-error" />
                </div>
            </v-list>
        </v-navigation-drawer>

        <!-- 右侧内容区 -->
        <div class="console-content fill-height overflow-auto">
            <div class="d-flex">
                <v-container fluid class="pa-4 pa-md-6" style="max-width: 1920px;">
                    <!-- 使用 router-view 渲染子路由 -->
                    <router-view />
                </v-container>
            </div>

        </div>

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
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores/user'
import { API } from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()
const { mobile } = useDisplay()

const drawer = ref(true)
const logoutDialog = ref(false)

// 提供 drawer 状态和切换方法给父组件
provide('consoleDrawer', drawer)

// 监听来自 App.vue 的 drawer 切换事件
const handleToggleDrawer = () => {
    drawer.value = !drawer.value
}

onMounted(() => {
    window.addEventListener('toggle-console-drawer', handleToggleDrawer)
})

onUnmounted(() => {
    window.removeEventListener('toggle-console-drawer', handleToggleDrawer)
})

const menuItems = [
    { title: '看板', value: 'dashboard', icon: 'mdi-view-dashboard', to: '/console/dashboard' },
    { title: '充值', value: 'topup', icon: 'mdi-wallet-plus', to: '/console/topup' },
    { title: '令牌', value: 'tokens', icon: 'mdi-key-variant', to: '/console/tokens' },
    { title: '模型', value: 'models', icon: 'mdi-cube-outline', to: '/console/models' },
    { title: '审计', value: 'logs', icon: 'mdi-history', to: '/console/logs' },
    { title: '个人', value: 'settings', icon: 'mdi-cog', to: '/console/settings' },
]

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
.console-layout {
    display: flex;
    position: relative;
}

.fill-height {
    height: 100%;
    min-height: calc(100vh - 64px);
}

.console-content {
    flex: 1;
    transition: margin-left 0.2s ease;
}

/* 手机端不需要 margin-left，因为 drawer 是 temporary 模式 */
@media (max-width: 1279px) {
    .console-content {
        margin-left: 0;
    }
}
</style>
