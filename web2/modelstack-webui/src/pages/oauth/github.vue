<template>
  <v-container fluid class="fill-height">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        />
        <h3 class="text-h6">{{ message }}</h3>
        <p v-if="retryCount > 0" class="text-body-2 text-grey mt-2">
          重试次数: {{ retryCount }} / {{ maxRetries }}
        </p>
      </v-col>
    </v-row>

    <!-- Snackbar 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { API, updateAPI, setUserData } from '@/utils/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const message = ref('正在处理授权...')
const retryCount = ref(0)
const maxRetries = 3

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'error'
})

function showMessage(text: string, color = 'error') {
  snackbar.value = { show: true, text, color }
}

async function sendCode(code: string, state: string, retry = 0): Promise<void> {
  retryCount.value = retry

  try {
    message.value = retry > 0 ? `正在重试... (${retry}/${maxRetries})` : '正在验证授权...'

    const { data: resData } = await API.get(`/api/oauth/github?code=${code}&state=${state}`)
    const { success, message: msg, data } = resData

    if (!success) {
      throw new Error(msg || 'GitHub OAuth 授权失败')
    }

    if (msg === 'bind') {
      showMessage('绑定成功！', 'success')
      message.value = '绑定成功，正在跳转...'
      setTimeout(() => {
        router.push('/console')
      }, 1000)
    } else {
      userStore.login(data)
      setUserData(data)
      updateAPI()
      showMessage('登录成功！', 'success')
      message.value = '登录成功，正在跳转...'
      setTimeout(() => {
        router.push('/console')
      }, 1000)
    }
  } catch (error: any) {
    if (retry < maxRetries) {
      // 递增的退避等待
      message.value = `授权失败，${(retry + 1) * 2}秒后重试...`
      await new Promise(resolve => setTimeout(resolve, (retry + 1) * 2000))
      return sendCode(code, state, retry + 1)
    }

    // 重试次数耗尽
    showMessage(error.message || '授权失败', 'error')
    message.value = '授权失败，正在跳转...'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
}

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string

  // 参数缺失直接返回
  if (!code) {
    showMessage('未获取到授权码', 'error')
    message.value = '授权失败，正在跳转...'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    return
  }

  await sendCode(code, state || '')
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
