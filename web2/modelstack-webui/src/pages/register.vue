<template>
  <v-container fluid class="fill-height bg-surface-variant">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="3" xl="3">
        <v-card class="pa-6" rounded="xl" elevation="0">
          <v-card-title class="text-h5 font-weight-bold pb-6">
            <v-img src="@/assets/logo.png" alt="Logo" width="64"/>
            <h2 class="text-h5 font-weight-bold ml-3 mt-2">创建账户</h2>
          </v-card-title>

          <v-card-text>
            <!-- OAuth 注册选项 -->
            <div v-if="!showEmailRegister && hasOAuthOptions" class="mb-4">
              <!-- GitHub 注册 -->
              <v-btn
                v-if="status.github_oauth"
                block
                variant="outlined"
                size="large"
                class="mb-3"
                rounded="pill"
                :loading="githubLoading"
                @click="handleGitHubClick"
              >
                <v-icon start>mdi-github</v-icon>
                使用 GitHub 继续
              </v-btn>

              <!-- OIDC 注册 -->
              <v-btn
                v-if="status.oidc_enabled"
                block
                variant="outlined"
                size="large"
                class="mb-3"
                rounded="pill"
                :loading="oidcLoading"
                @click="handleOIDCClick"
              >
                <v-icon start>mdi-shield-account</v-icon>
                {{ status.oidc_display_name ? `使用 ${status.oidc_display_name} 继续` : '使用 OIDC 继续' }}
              </v-btn>

              <v-divider class="my-4">
                <span class="text-grey px-2">或</span>
              </v-divider>

              <!-- 邮箱注册按钮 -->
              <v-btn
                block
                color="primary"
                size="large"
                rounded="pill"
                @click="showEmailRegister = true"
              >
                <v-icon start>mdi-email</v-icon>
                使用邮箱注册
              </v-btn>
            </div>

            <!-- 邮箱注册表单 -->
            <v-form v-if="showEmailRegister || !hasOAuthOptions" ref="registerForm" @submit.prevent="handleSubmit" class="ml-3 mr-3">
              <v-text-field
                v-model="formData.username"
                label="用户名"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                class="mb-2"
              />

              <v-text-field
                v-model="formData.password"
                label="密码"
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
                v-model="formData.password2"
                label="确认密码"
                prepend-inner-icon="mdi-lock-check"
                :type="showPassword2 ? 'text' : 'password'"
                :append-inner-icon="showPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.passwordMatch]"
                class="mb-2"
                @click:append-inner="showPassword2 = !showPassword2"
              />

              <!-- 邮箱验证 -->
              <template v-if="showEmailVerification">
                <v-text-field
                  v-model="formData.email"
                  label="邮箱"
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
                      :loading="verificationCodeLoading"
                      :disabled="disableCodeButton || verificationCodeLoading"
                      @click="sendVerificationCode"
                    >
                      {{ disableCodeButton ? `重新发送 (${countdown})` : '获取验证码' }}
                    </v-btn>
                  </template>
                </v-text-field>

                <v-text-field
                  v-model="formData.verification_code"
                  label="验证码"
                  prepend-inner-icon="mdi-numeric"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required]"
                  class="mb-2"
                />
              </template>

              <!-- Turnstile 验证 -->
              <div v-if="turnstileEnabled" class="d-flex justify-center mb-4">
                <div ref="turnstileContainer"></div>
              </div>

              <!-- 用户协议 -->
              <v-checkbox
                v-if="hasUserAgreement || hasPrivacyPolicy"
                v-model="agreedToTerms"
                density="compact"
                class="mb-2"
              >
                <template #label>
                  <span class="text-body-2">
                    我已阅读并同意
                    <a v-if="hasUserAgreement" href="/user-agreement" target="_blank" class="text-primary">用户协议</a>
                    <span v-if="hasUserAgreement && hasPrivacyPolicy">和</span>
                    <a v-if="hasPrivacyPolicy" href="/privacy-policy" target="_blank" class="text-primary">隐私政策</a>
                  </span>
                </template>
              </v-checkbox>

              <v-btn
                block
                color="primary"
                size="large"
                type="submit"
                elevation="0"
                :loading="registerLoading"
                :disabled="(hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms"
              >
                注册
              </v-btn>

              <!-- 返回其他注册选项 -->
              <div v-if="hasOAuthOptions" class="mt-4">
                <v-divider class="my-4">
                  <span class="text-grey px-2">或</span>
                </v-divider>
                <v-btn
                  block
                  variant="outlined"
                  rounded="pill"
                  @click="showEmailRegister = false"
                >
                  其他注册选项
                </v-btn>
              </div>
            </v-form>

            <!-- 登录链接 -->
            <div class="text-center mt-6">
              <span class="text-body-2">
                已有账户？
                <router-link to="/login" class="text-primary font-weight-medium">
                  登录
                </router-link>
              </span>
            </div>
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { API, getSystemStatus, getSystemName, onOIDCClicked, onGitHubOAuthClicked } from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  password2: '',
  email: '',
  verification_code: ''
})

const showPassword = ref(false)
const showPassword2 = ref(false)
const showEmailRegister = ref(false)
const agreedToTerms = ref(false)

// 加载状态
const registerLoading = ref(false)
const oidcLoading = ref(false)
const githubLoading = ref(false)
const verificationCodeLoading = ref(false)

// 验证码倒计时
const disableCodeButton = ref(false)
const countdown = ref(30)
let countdownInterval: number | null = null

// Turnstile
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileToken = ref('')
const turnstileContainer = ref<HTMLElement | null>(null)
let turnstileWidgetId: string | null = null

// 系统状态
const status = ref(getSystemStatus())
const systemName = ref(getSystemName())
const showEmailVerification = computed(() => status.value.email_verification ?? false)

// 用户协议
const hasUserAgreement = computed(() => status.value.user_agreement_enabled || false)
const hasPrivacyPolicy = computed(() => status.value.privacy_policy_enabled || false)

// 是否有 OAuth 选项
const hasOAuthOptions = computed(() => status.value.oidc_enabled || status.value.github_oauth)

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
  passwordMatch: (value: string) => value === formData.password || '两次输入的密码不一致'
}

// 显示消息
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
  if (!formData.email) {
    showMessage('请输入邮箱地址', 'warning')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value) {
    showMessage('请稍后几秒重试，Turnstile 正在检查用户环境！', 'warning')
    return
  }

  verificationCodeLoading.value = true
  try {
    const res = await API.get(`/api/verification?email=${formData.email}&turnstile=${turnstileToken.value}`)
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
    verificationCodeLoading.value = false
  }
}

// 开始倒计时
function startCountdown() {
  disableCodeButton.value = true
  countdown.value = 30

  countdownInterval = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      disableCodeButton.value = false
      countdown.value = 30
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }
  }, 1000)
}

// 处理注册
async function handleSubmit() {
  if (formData.password.length < 8) {
    showMessage('密码长度不得小于 8 位！', 'warning')
    return
  }

  if (formData.password !== formData.password2) {
    showMessage('两次输入的密码不一致', 'warning')
    return
  }

  if ((hasUserAgreement.value || hasPrivacyPolicy.value) && !agreedToTerms.value) {
    showMessage('请先阅读并同意用户协议和隐私政策', 'warning')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value) {
    showMessage('请稍后几秒重试，Turnstile 正在检查用户环境！', 'warning')
    return
  }

  if (!formData.username || !formData.password) {
    showMessage('请输入用户名和密码！', 'warning')
    return
  }

  registerLoading.value = true
  try {
    // 获取邀请码
    let affCode = new URLSearchParams(window.location.search).get('aff')
    if (!affCode) {
      affCode = localStorage.getItem('aff')
    }

    const res = await API.post(`/api/user/register?turnstile=${turnstileToken.value}`, {
      username: formData.username,
      password: formData.password,
      email: formData.email,
      verification_code: formData.verification_code,
      aff_code: affCode
    })

    const { success, message } = res.data

    if (success) {
      showMessage('注册成功！', 'success')
      router.push('/login')
    } else {
      showMessage(message || '注册失败')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.message || '注册失败，请重试')
  } finally {
    registerLoading.value = false
  }
}

// GitHub 注册（跳转到 GitHub）
async function handleGitHubClick() {
  if ((hasUserAgreement.value || hasPrivacyPolicy.value) && !agreedToTerms.value) {
    showMessage('请先阅读并同意用户协议和隐私政策', 'warning')
    return
  }

  githubLoading.value = true
  try {
    await onGitHubOAuthClicked(status.value.github_client_id!)
  } finally {
    setTimeout(() => {
      githubLoading.value = false
    }, 3000)
  }
}

// OIDC 注册（跳转到 OIDC 提供商）
function handleOIDCClick() {
  if ((hasUserAgreement.value || hasPrivacyPolicy.value) && !agreedToTerms.value) {
    showMessage('请先阅读并同意用户协议和隐私政策', 'warning')
    return
  }

  oidcLoading.value = true
  try {
    onOIDCClicked(status.value.oidc_authorization_endpoint!, status.value.oidc_client_id!)
  } finally {
    setTimeout(() => {
      oidcLoading.value = false
    }, 3000)
  }
}

onMounted(() => {
  // 保存邀请码
  const affCode = new URLSearchParams(window.location.search).get('aff')
  if (affCode) {
    localStorage.setItem('aff', affCode)
  }

  // 加载系统状态
  const savedStatus = getSystemStatus()
  status.value = savedStatus

  if (savedStatus.turnstile_check) {
    turnstileEnabled.value = true
    turnstileSiteKey.value = savedStatus.turnstile_site_key || ''
    
    setTimeout(initTurnstile, 500)
  }

  // 如果已登录，跳转到控制台
  if (userStore.isLoggedIn) {
    router.replace('/console')
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
