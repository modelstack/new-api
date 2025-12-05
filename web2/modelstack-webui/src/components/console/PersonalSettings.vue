<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">个人设置</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          管理您的个人资料和安全设置
        </p>
      </div>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="refreshData"
      >
        刷新
      </v-btn>
    </div>

    <!-- Tab 切换 -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="profile">
        <v-icon start>mdi-account</v-icon>
        个人资料
      </v-tab>
      <v-tab value="security">
        <v-icon start>mdi-shield-lock</v-icon>
        安全设置
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <!-- 个人资料 Tab -->
      <v-tabs-window-item value="profile">
        <!-- 用户资料卡片 -->
        <v-card variant="flat" class="mb-4">
          <v-card-text class="pa-6">
            <v-row align="center">
              <!-- 左侧头像 -->
              <v-col cols="12" sm="auto" class="text-center text-sm-start">
                <v-avatar size="100" color="primary">
                  <v-icon size="60" color="white">mdi-account</v-icon>
                </v-avatar>
              </v-col>
              <!-- 右侧基本信息 -->
              <v-col cols="12" sm class="text-center text-sm-start">
                <div class="mb-2">
                  <h2 class="text-h5 font-weight-bold">
                    <v-skeleton-loader v-if="loading" type="text" width="150" />
                    <span v-else>{{ userData?.display_name || userData?.username || '-' }}</span>
                  </h2>
                </div>
                <div class="text-body-1 text-medium-emphasis mb-2">
                  <v-skeleton-loader v-if="loading" type="text" width="100" />
                  <span v-else>@{{ userData?.username || '-' }}</span>
                </div>
                <v-chip
                  :color="getRoleColor(userData?.role)"
                  variant="tonal"
                  size="small"
                  class="mr-2"
                >
                  {{ getRoleName(userData?.role) }}
                </v-chip>
                <v-chip
                  color="blue-grey"
                  variant="tonal"
                  size="small"
                >
                  {{ userData?.group || 'default' }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 详细信息卡片 -->
        <v-card variant="flat">
          <v-card-title class="d-flex align-center pb-0">
            <v-icon class="mr-2" color="primary">mdi-information</v-icon>
            详细信息
          </v-card-title>
          <v-card-text class="pa-6">
            <v-row>
              <!-- 基本信息 -->
              <v-col cols="12" md="6">
                <v-list density="compact" class="bg-transparent">
                  <v-list-subheader class="text-caption font-weight-bold">
                    基本信息
                  </v-list-subheader>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="grey">mdi-identifier</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">用户 ID</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="80" />
                      <span v-else class="font-weight-medium">{{ userData?.id || '-' }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="grey">mdi-account</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">用户名</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="100" />
                      <span v-else class="font-weight-medium">{{ userData?.username || '-' }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="grey">mdi-email</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">邮箱</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="150" />
                      <span v-else class="font-weight-medium">{{ userData?.email || '未绑定' }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="grey">mdi-account-group</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">用户组</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="80" />
                      <span v-else class="font-weight-medium">{{ userData?.group || 'default' }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <!-- 账户统计 -->
              <v-col cols="12" md="6">
                <v-list density="compact" class="bg-transparent">
                  <v-list-subheader class="text-caption font-weight-bold">
                    账户统计
                  </v-list-subheader>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="green">mdi-wallet</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">当前余额</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="100" />
                      <span v-else class="font-weight-medium text-green">{{ formatQuota(userData?.quota || 0) }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="orange">mdi-chart-line</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">已用额度</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="100" />
                      <span v-else class="font-weight-medium">{{ formatQuota(userData?.used_quota || 0) }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="blue">mdi-counter</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">请求总次数</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="80" />
                      <span v-else class="font-weight-medium">{{ (userData?.request_count || 0).toLocaleString() }} 次</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="purple">mdi-gift</v-icon>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">邀请码</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-skeleton-loader v-if="loading" type="text" width="120" />
                      <div v-else class="d-flex align-center">
                        <span class="font-weight-medium font-mono">{{ userData?.aff_code || '无' }}</span>
                        <v-btn
                          v-if="userData?.aff_code"
                          icon
                          size="x-small"
                          variant="text"
                          class="ml-1"
                          @click="copyAffCode"
                        >
                          <v-icon size="16">mdi-content-copy</v-icon>
                        </v-btn>
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 邀请统计卡片 -->
        <v-card variant="flat" class="mt-4" v-if="userData?.aff_code">
          <v-card-title class="d-flex align-center pb-0">
            <v-icon class="mr-2" color="primary">mdi-account-multiple-plus</v-icon>
            邀请统计
          </v-card-title>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" sm="4">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ userData?.aff_count || 0 }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">邀请人数</div>
                </div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-green">
                    {{ formatQuota(userData?.aff_quota || 0) }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">待提现奖励</div>
                </div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-blue">
                    {{ formatQuota(userData?.aff_history_quota || 0) }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">历史奖励</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 绑定账号卡片 -->
        <v-card variant="flat" class="mt-4">
          <v-card-title class="d-flex align-center pb-0">
            <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
            绑定账号
          </v-card-title>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-avatar color="grey-darken-3" size="40">
                      <v-icon color="white">mdi-github</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>GitHub</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="userData?.github_id ? 'success' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ userData?.github_id ? '已绑定' : '未绑定' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-avatar color="green" size="40">
                      <v-icon color="white">mdi-wechat</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>微信</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="userData?.wechat_id ? 'success' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ userData?.wechat_id ? '已绑定' : '未绑定' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-avatar color="blue" size="40">
                      <v-icon color="white">mdi-telegram</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>Telegram</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="userData?.telegram_id ? 'success' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ userData?.telegram_id ? '已绑定' : '未绑定' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-avatar color="indigo" size="40">
                      <v-icon color="white">mdi-discord</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>Discord</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="userData?.discord_id ? 'success' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ userData?.discord_id ? '已绑定' : '未绑定' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- 安全设置 Tab -->
      <v-tabs-window-item value="security">
        <!-- 修改密码卡片 -->
        <v-card variant="flat" class="mb-4 pt-2">
          <v-card-title class="d-flex align-center pb-0">
            <v-icon class="mr-2" color="primary">mdi-lock-reset</v-icon>
            修改密码
          </v-card-title>
          <v-card-text class="pa-6">
            <v-form ref="passwordFormRef" @submit.prevent="changePassword">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="passwordForm.oldPassword"
                    label="当前密码"
                    type="password"
                    variant="outlined"
                    hide-details
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-lock"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="passwordForm.newPassword"
                    label="新密码"
                    type="password"
                    variant="outlined"
                    hide-details
                    :rules="[rules.required, rules.minLength(8)]"
                    prepend-inner-icon="mdi-lock-plus"
                    hint="密码长度至少 8 位"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="passwordForm.confirmPassword"
                    label="确认新密码"
                    type="password"
                    variant="outlined"
                    hide-details
                    :rules="[rules.required, rules.passwordMatch]"
                    prepend-inner-icon="mdi-lock-check"
                  />
                </v-col>
              </v-row>
              <v-btn
                class="mt-5"
                color="primary"
                type="submit"
                :loading="passwordLoading"
                :disabled="passwordLoading"
              >
                <v-icon start>mdi-check</v-icon>
                确认修改
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- 用户级别 Token 卡片 -->
        <v-card variant="flat" class="pt-2">
          <v-card-title class="d-flex align-center pb-0">
            <v-icon class="mr-2" color="primary">mdi-key-variant</v-icon>
            用户级别 Access Token
          </v-card-title>
          <v-card-subtitle class="mt-1">
            用于第三方应用访问 API，该 Token 拥有您账户的所有权限
          </v-card-subtitle>
          <v-card-text class="pa-6">
            <v-alert
              type="warning"
              variant="tonal"
              class="mb-4"
              density="compact"
            >
              <div class="text-body-2">
                <strong>注意：</strong>Token 拥有您账户的全部权限，请妥善保管，不要泄露给他人。每次生成新 Token 会使旧 Token 失效。
              </div>
            </v-alert>

            <!-- 显示已生成的 Token -->
            <div v-if="userToken" class="mb-4">
              <v-label class="text-caption mb-2">当前 Token</v-label>
              <v-text-field
                :model-value="userToken"
                readonly
                variant="outlined"
                density="comfortable"
                class="font-mono"
                append-inner-icon="mdi-content-copy"
                @click:append-inner="copyUserToken"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
              </v-text-field>
              <p class="text-caption text-medium-emphasis">
                请立即复制并保存此 Token，关闭页面后将无法再次查看。
              </p>
            </div>

            <v-btn
              color="primary"
              :loading="tokenLoading"
              :disabled="tokenLoading"
              @click="generateUserToken"
            >
              <v-icon start>mdi-refresh</v-icon>
              {{ userToken ? '重新生成 Token' : '生成 Token' }}
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Danger Zone -->
        <v-card variant="outlined" class="mt-4 pt-2" color="error">
          <v-card-title class="d-flex align-center pb-0 text-error">
            <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
            危险区域
          </v-card-title>
          <v-card-text class="pa-6">
            <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between">
              <div class="mb-4 mb-sm-0">
                <div class="text-subtitle-1 font-weight-medium">注销账号</div>
                <div class="text-body-2 text-medium-emphasis">
                  永久删除您的账号和所有相关数据，此操作不可撤销。
                </div>
              </div>
              <v-btn
                color="error"
                variant="outlined"
                @click="showDeleteAccountDialog"
              >
                <v-icon start>mdi-delete-forever</v-icon>
                注销账号
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- 注销账号确认对话框 -->
    <v-dialog v-model="deleteAccountDialog" max-width="500" persistent>
      <v-card class="pa-2">
        <v-card-title class="text-error d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          确认注销账号
        </v-card-title>
        <v-card-text>
          <v-alert type="error" variant="tonal" class="mb-4" density="compact">
            此操作将永久删除您的账号，包括所有数据、Token 和使用记录。此操作无法撤销！
          </v-alert>
          <p class="text-body-2 mb-4">
            请输入您的用户名 <strong>{{ userData?.username }}</strong> 以确认注销：
          </p>
          <v-text-field
            v-model="deleteAccountConfirmUsername"
            label="确认用户名"
            variant="outlined"
            density="comfortable"
            :placeholder="userData?.username"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteAccountDialog = false">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteAccountLoading"
            :disabled="deleteAccountConfirmUsername !== userData?.username || deleteAccountLoading"
            @click="confirmDeleteAccount"
          >
            确认注销
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/utils/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 状态
const loading = ref(false)
const activeTab = ref('profile')
const userData = ref<any>(null)

// 密码修改相关
const passwordFormRef = ref<any>(null)
const passwordLoading = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Token 相关
const tokenLoading = ref(false)
const userToken = ref('')

// 注销账号相关
const deleteAccountDialog = ref(false)
const deleteAccountLoading = ref(false)
const deleteAccountConfirmUsername = ref('')

// 表单验证规则
const rules = {
  required: (v: string) => !!v || '此项为必填',
  minLength: (min: number) => (v: string) => (v && v.length >= min) || `长度至少 ${min} 位`,
  passwordMatch: (v: string) => v === passwordForm.value.newPassword || '两次输入的密码不一致'
}

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

function showMessage(message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// 格式化额度显示
function formatQuota(quota: number): string {
  if (quota === undefined || quota === null) return '0'
  // 假设 quota 单位是 1/500000 美元
  const dollars = quota / 500000
  if (dollars >= 1) {
    return '✦' + dollars.toFixed(2)
  } else if (dollars >= 0.01) {
    return '✦' + dollars.toFixed(4)
  } else {
    return '✦' + dollars.toFixed(6)
  }
}

// 获取角色名称
function getRoleName(role?: number): string {
  if (role === undefined || role === null) return '普通用户'
  if (role >= 100) return '超级管理员'
  if (role >= 10) return '管理员'
  return '普通用户'
}

// 获取角色颜色
function getRoleColor(role?: number): string {
  if (role === undefined || role === null) return 'grey'
  if (role >= 100) return 'error'
  if (role >= 10) return 'warning'
  return 'primary'
}

// 复制邀请码
async function copyAffCode() {
  if (!userData.value?.aff_code) return
  try {
    await navigator.clipboard.writeText(userData.value.aff_code)
    showMessage('邀请码已复制到剪贴板', 'success')
  } catch {
    showMessage('复制失败', 'error')
  }
}

// 获取用户数据
async function fetchUserData() {
  loading.value = true
  try {
    const res = await API.get('/api/user/self')
    if (res.data.success && res.data.data) {
      userData.value = res.data.data
    } else {
      showMessage('获取用户信息失败', 'error')
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    showMessage('获取用户信息失败', 'error')
  } finally {
    loading.value = false
  }
}

// 刷新数据
function refreshData() {
  fetchUserData()
}

// 修改密码
async function changePassword() {
  const { valid } = await passwordFormRef.value?.validate()
  if (!valid) return

  passwordLoading.value = true
  try {
    const res = await API.put('/api/user/self', {
      original_password: passwordForm.value.oldPassword,
      password: passwordForm.value.newPassword
    })
    if (res.data.success) {
      showMessage('密码修改成功', 'success')
      // 清空表单
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      passwordFormRef.value?.reset()
    } else {
      showMessage(res.data.message || '密码修改失败', 'error')
    }
  } catch (error: any) {
    console.error('Failed to change password:', error)
    showMessage(error?.response?.data?.message || '密码修改失败', 'error')
  } finally {
    passwordLoading.value = false
  }
}

// 生成用户级别 Token
async function generateUserToken() {
  tokenLoading.value = true
  try {
    const res = await API.get('/api/user/token')
    if (res.data.success && res.data.data) {
      userToken.value = res.data.data
      showMessage('Token 生成成功', 'success')
    } else {
      showMessage(res.data.message || 'Token 生成失败', 'error')
    }
  } catch (error: any) {
    console.error('Failed to generate token:', error)
    showMessage(error?.response?.data?.message || 'Token 生成失败', 'error')
  } finally {
    tokenLoading.value = false
  }
}

// 复制用户 Token
async function copyUserToken() {
  if (!userToken.value) return
  try {
    await navigator.clipboard.writeText(userToken.value)
    showMessage('Token 已复制到剪贴板', 'success')
  } catch {
    showMessage('复制失败', 'error')
  }
}

// 显示注销账号对话框
function showDeleteAccountDialog() {
  deleteAccountConfirmUsername.value = ''
  deleteAccountDialog.value = true
}

// 确认注销账号
async function confirmDeleteAccount() {
  if (deleteAccountConfirmUsername.value !== userData.value?.username) {
    showMessage('用户名不匹配', 'error')
    return
  }

  deleteAccountLoading.value = true
  try {
    const res = await API.delete('/api/user/self')
    if (res.data.success) {
      showMessage('账号已注销', 'success')
      deleteAccountDialog.value = false
      // 清理用户状态并跳转到首页
      userStore.logout()
      router.push('/')
    } else {
      showMessage(res.data.message || '注销失败', 'error')
    }
  } catch (error: any) {
    console.error('Failed to delete account:', error)
    showMessage(error?.response?.data?.message || '注销失败', 'error')
  } finally {
    deleteAccountLoading.value = false
  }
}

onMounted(() => {
  fetchUserData()
})
</script>

<style scoped>
.font-mono {
  font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
</style>
