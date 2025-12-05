// API 工具函数和 axios 实例
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { useUserStore } from '@/stores/user'

// 获取用户ID
function getUserIdFromLocalStorage(): number {
  const user = localStorage.getItem('user')
  if (!user) return -1
  try {
    return JSON.parse(user).id
  } catch {
    return -1
  }
}

// 创建 axios 实例
export const createAPI = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
      'New-API-User': getUserIdFromLocalStorage().toString(),
      'Cache-Control': 'no-store'
    }
  })

  // 响应拦截器
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.config?.skipErrorHandler) {
        return Promise.reject(error)
      }
      
      if (error.response?.status === 401) {
        // 清除用户状态
        localStorage.removeItem('user')
        // 重定向到登录页
        window.location.href = '/login?expired=true'
      }
      
      return Promise.reject(error)
    }
  )

  return instance
}

export let API = createAPI()

// 更新 API 实例（登录后调用）
export function updateAPI(): void {
  API = createAPI()
}

// 系统状态接口
export interface SystemStatus {
  turnstile_check?: boolean
  turnstile_site_key?: string
  email_verification?: boolean
  oidc_enabled?: boolean
  oidc_client_id?: string
  oidc_authorization_endpoint?: string
  oidc_display_name?: string
  github_oauth?: boolean
  github_client_id?: string
  user_agreement_enabled?: boolean
  privacy_policy_enabled?: boolean
  self_use_mode_enabled?: boolean
  register_enabled?: boolean
}

// 获取系统状态
export function getSystemStatus(): SystemStatus {
  const status = localStorage.getItem('status')
  if (status) {
    try {
      return JSON.parse(status)
    } catch {
      return {}
    }
  }
  return {}
}

// 加载系统状态
export async function loadSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await API.get('/api/status')
    if (res.data.success) {
      const status = res.data.data
      localStorage.setItem('status', JSON.stringify(status))
      
      // 保存系统名称和 logo
      if (status.system_name) {
        localStorage.setItem('system_name', status.system_name)
      }
      if (status.logo) {
        localStorage.setItem('logo', status.logo)
      }
      
      return status
    }
  } catch (error) {
    console.error('Failed to load system status:', error)
  }
  return getSystemStatus()
}

// 获取系统名称
export function getSystemName(): string {
  return localStorage.getItem('system_name') || 'New API'
}

// 保存用户数据
export function setUserData(user: any): void {
  localStorage.setItem('user', JSON.stringify(user))
}

// 获取 OAuth State
export async function getOAuthState(): Promise<string> {
  let path = '/api/oauth/state'
  const affCode = localStorage.getItem('aff')
  if (affCode && affCode.length > 0) {
    path += `?aff=${affCode}`
  }
  try {
    const res = await API.get(path)
    const { success, data } = res.data
    if (success) {
      return data
    }
  } catch (error) {
    console.error('Failed to get OAuth state:', error)
  }
  return ''
}

// OIDC 登录跳转
export async function onOIDCClicked(authorizationEndpoint: string, clientId: string): Promise<void> {
  const state = await getOAuthState()
  if (!state) return
  
  const redirectUri = `${window.location.origin}/oauth/oidc`
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    state: state
  })
  
  window.location.href = `${authorizationEndpoint}?${params.toString()}`
}

// GitHub OAuth 登录跳转
export async function onGitHubOAuthClicked(githubClientId: string): Promise<void> {
  const state = await getOAuthState()
  if (!state) return
  window.open(
    `https://github.com/login/oauth/authorize?client_id=${githubClientId}&state=${state}&scope=user:email`
  )
}
