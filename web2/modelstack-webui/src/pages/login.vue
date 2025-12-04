<template>
  <v-container fluid class="fill-height bg-grey-lighten-4">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <!-- Logo 和系统名称 -->
        <div class="text-center mb-6">
          <v-avatar size="64" class="mb-2">
            <v-img :src="logo" alt="Logo" />
          </v-avatar>
          <h2 class="text-h5 font-weight-bold">{{ systemName }}</h2>
        </div>

        <v-card class="pa-6" rounded="xl" elevation="2">
          <v-card-title class="text-center text-h5 font-weight-bold pb-4">
            登录
          </v-card-title>

          <v-card-text>
            <!-- OAuth 登录选项 -->
            <div v-if="!showEmailLogin && hasOAuthOptions" class="mb-4">
              <!-- OIDC 登录 -->
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

              <!-- 邮箱登录按钮 -->
              <v-btn
                block
                color="primary"
                size="large"
                rounded="pill"
                @click="showEmailLogin = true"
              >
                <v-icon start>mdi-email</v-icon>
                使用邮箱或用户名登录
              </v-btn>
            </div>

            <!-- 邮箱登录表单 -->
            <v-form v-if="showEmailLogin || !hasOAuthOptions" ref="loginForm" @submit.prevent="handleSubmit">
              <v-text-field
                v-model="username"
                label="用户名或邮箱"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                class="mb-2"
              />

              <v-text-field
                v-model="password"
                label="密码"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                class="mb-2"
                @click:append-inner="showPassword = !showPassword"
              />

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
                rounded="pill"
                type="submit"
                :loading="loginLoading"
                :disabled="(hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms"
              >
                继续
              </v-btn>

              <v-btn
                block
                variant="text"
                size="small"
                class="mt-2"
                to="/reset"
              >
                忘记密码？
              </v-btn>

              <!-- 返回其他登录选项 -->
              <div v-if="hasOAuthOptions" class="mt-4">
                <v-divider class="my-4">
                  <span class="text-grey px-2">或</span>
                </v-divider>
                <v-btn
                  block
                  variant="outlined"
                  rounded="pill"
                  @click="showEmailLogin = false"
                >
                  其他登录选项
                </v-btn>
              </div>
            </v-form>

            <!-- 注册链接 -->
            <div v-if="!status.self_use_mode_enabled" class="text-center mt-6">
              <span class="text-body-2">
                没有账户？
                <router-link to="/register" class="text-primary font-weight-medium">
                  注册
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { API, updateAPI, getSystemStatus, getSystemName, getLogo, setUserData, onOIDCClicked } from '@/utils/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单数据
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const showEmailLogin = ref(false)
const agreedToTerms = ref(false)

// 加载状态
const loginLoading = ref(false)
const oidcLoading = ref(false)

// Turnstile
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileToken = ref('')
const turnstileContainer = ref<HTMLElement | null>(null)
let turnstileWidgetId: string | null = null

// 系统状态
const status = ref(getSystemStatus())
const systemName = ref(getSystemName())
const logo = ref(getLogo())

// 用户协议
const hasUserAgreement = computed(() => status.value.user_agreement_enabled || false)
const hasPrivacyPolicy = computed(() => status.value.privacy_policy_enabled || false)

// 是否有 OAuth 选项
const hasOAuthOptions = computed(() => status.value.oidc_enabled)

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'error'
})

// 表单验证规则
const rules = {
  required: (value: string) => !!value || '此字段为必填项'
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

// 处理登录
async function handleSubmit() {
  if ((hasUserAgreement.value || hasPrivacyPolicy.value) && !agreedToTerms.value) {
    showMessage('请先阅读并同意用户协议和隐私政策', 'warning')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value) {
    showMessage('请稍后几秒重试，Turnstile 正在检查用户环境！', 'warning')
    return
  }

  if (!username.value || !password.value) {
    showMessage('请输入用户名和密码！', 'warning')
    return
  }

  loginLoading.value = true
  try {
    const res = await API.post(`/api/user/login?turnstile=${turnstileToken.value}`, {
      username: username.value,
      password: password.value
    })

    const { success, message, data } = res.data

    if (success) {
      // 检查是否需要2FA验证
      if (data?.require_2fa) {
        showMessage('暂不支持2FA验证', 'warning')
        return
      }

      userStore.login(data)
      setUserData(data)
      updateAPI()
      showMessage('登录成功！', 'success')

      // 检查默认密码
      if (username.value === 'root' && password.value === '123456') {
        showMessage('您正在使用默认密码！请立刻修改默认密码！', 'warning')
      }

      router.push('/console')
    } else {
      showMessage(message || '登录失败')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.message || '登录失败，请重试')
  } finally {
    loginLoading.value = false
  }
}

// OIDC 登录
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
  // 加载系统状态
  const savedStatus = getSystemStatus()
  status.value = savedStatus

  if (savedStatus.turnstile_check) {
    turnstileEnabled.value = true
    turnstileSiteKey.value = savedStatus.turnstile_site_key || ''
    
    // 等待 Turnstile 脚本加载
    setTimeout(initTurnstile, 500)
  }

  // 检查是否登录过期
  if (route.query.expired) {
    showMessage('未登录或登录已过期，请重新登录', 'warning')
  }

  // 如果已登录，跳转到控制台
  if (userStore.isLoggedIn) {
    router.replace('/console')
  }
})

onUnmounted(() => {
  cleanupTurnstile()
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
