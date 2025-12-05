<template>
  <v-container fluid class="fill-height bg-surface-variant">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card class="pa-6" rounded="xl" elevation="0">
          <v-card-title class="text-h5 font-weight-bold pb-6">
            <v-img src="@/assets/logo.png" alt="Logo" width="64"/>
            <h2 class="text-h5 font-weight-bold ml-3 mt-2">重置密码</h2>
          </v-card-title>

          <v-card-text>
            <v-form ref="resetForm" @submit.prevent="handleSubmit" class="ml-3 mr-3">
              <v-text-field
                v-model="email"
                label="邮箱地址"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.email]"
                class="mb-2"
              >
                <template #append-inner>
                  <v-btn
                    variant="text"
                    size="small"
                    :loading="sendingCode"
                    :disabled="disableCodeButton || sendingCode"
                    @click="sendVerificationCode"
                  >
                    {{ disableCodeButton ? `重新发送 (${countdown})` : '获取验证码' }}
                  </v-btn>
                </template>
              </v-text-field>

              <v-text-field
                v-model="verificationCode"
                label="验证码"
                prepend-inner-icon="mdi-numeric"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                class="mb-2"
              />

              <v-text-field
                v-model="newPassword"
                label="新密码"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                variant="outlined"
                density="comfortable"
                hint="密码长度 8-20 位"
                :rules="[rules.required, rules.minLength]"
                class="mb-2"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-text-field
                v-model="confirmPassword"
                label="确认新密码"
                prepend-inner-icon="mdi-lock-check"
                :type="showPassword2 ? 'text' : 'password'"
                :append-inner-icon="showPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.passwordMatch]"
                class="mb-4"
                @click:append-inner="showPassword2 = !showPassword2"
              />

              <!-- Turnstile 验证 -->
              <div v-if="turnstileEnabled" class="d-flex justify-center mb-4">
                <div ref="turnstileContainer"></div>
              </div>

              <v-btn
                block
                color="primary"
                size="large"
                type="submit"
                elevation="0"
                :loading="resetting"
              >
                重置密码
              </v-btn>

              <div class="text-center mt-4">
                <router-link to="/login" class="text-primary text-decoration-none">
                  返回登录
                </router-link>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { API, getSystemStatus } from '@/utils/api'

const router = useRouter()

// 表单数据
const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showPassword2 = ref(false)

// 加载状态
const sendingCode = ref(false)
const resetting = ref(false)

// 验证码倒计时
const disableCodeButton = ref(false)
const countdown = ref(60)
let countdownInterval: number | null = null

// Turnstile
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileToken = ref('')
const turnstileContainer = ref<HTMLElement | null>(null)
let turnstileWidgetId: string | null = null

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'error'
})

// 表单验证规则
const rules = {
  required: (value: string) => !!value || '此字段为必填项',
  minLength: (value: string) => (value && value.length >= 8) || '密码长度不得小于 8 位',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || '请输入有效的邮箱地址'
  },
  passwordMatch: (value: string) => value === newPassword.value || '两次输入的密码不一致'
}

function showMessage(text: string, color = 'error') {
  snackbar.value = { show: true, text, color }
}

// 初始化 Turnstile
function initTurnstile() {
  if (!turnstileEnabled.value || !turnstileContainer.value) return
  
  // @ts-ignore
  if (window.turnstile) {
    // @ts-ignore
    turnstileWidgetId = window.turnstile.render(turnstileContainer.value, {
      sitekey: turnstileSiteKey.value,
      callback: (token: string) => {
        turnstileToken.value = token
      }
    })
  }
}

// 清理 Turnstile
function cleanupTurnstile() {
  // @ts-ignore
  if (turnstileWidgetId && window.turnstile) {
    // @ts-ignore
    window.turnstile.remove(turnstileWidgetId)
  }
}

// 发送验证码
async function sendVerificationCode() {
  if (!email.value) {
    showMessage('请输入邮箱地址', 'warning')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value) {
    showMessage('请稍后几秒重试，Turnstile 正在检查用户环境！', 'warning')
    return
  }

  sendingCode.value = true
  try {
    const res = await API.get(`/api/verification?email=${email.value}&turnstile=${turnstileToken.value}`)
    const { success, message } = res.data

    if (success) {
      showMessage('验证码发送成功，请检查你的邮箱！', 'success')
      startCountdown()
    } else {
      showMessage(message || '发送验证码失败')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.message || '发送验证码失败，请重试')
  } finally {
    sendingCode.value = false
  }
}

// 开始倒计时
function startCountdown() {
  disableCodeButton.value = true
  countdown.value = 60

  countdownInterval = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      disableCodeButton.value = false
      countdown.value = 60
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }
  }, 1000)
}

// 提交重置密码
async function handleSubmit() {
  if (!email.value || !verificationCode.value || !newPassword.value || !confirmPassword.value) {
    showMessage('请填写所有必填项', 'warning')
    return
  }

  if (newPassword.value.length < 8) {
    showMessage('密码长度不得小于 8 位', 'warning')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showMessage('两次输入的密码不一致', 'warning')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value) {
    showMessage('请稍后几秒重试，Turnstile 正在检查用户环境！', 'warning')
    return
  }

  resetting.value = true
  try {
    const res = await API.post(`/api/user/reset?turnstile=${turnstileToken.value}`, {
      email: email.value,
      verification_code: verificationCode.value,
      password: newPassword.value
    })

    const { success, message } = res.data

    if (success) {
      showMessage('密码重置成功！', 'success')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      showMessage(message || '密码重置失败')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.message || '密码重置失败，请重试')
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  const status = getSystemStatus()
  if (status.turnstile_check) {
    turnstileEnabled.value = true
    turnstileSiteKey.value = status.turnstile_site_key || ''
    setTimeout(initTurnstile, 500)
  }
})

onUnmounted(() => {
  cleanupTurnstile()
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<style scoped>
.fill-height {
  min-height: 100%;
}
</style>
