// User Store - 用户状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API } from '@/utils/api'

export interface User {
  id: number
  username: string
  display_name?: string
  email?: string
  role: number
  status: number
  token?: string
  avatar?: string
  quota?: number
  used_quota?: number
  request_count?: number
  group?: string
  aff_code?: string
  aff_count?: number
  aff_quota?: number
  aff_history_quota?: number
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isUserFetched = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value && user.value.role >= 10)
  const isRoot = computed(() => user.value && user.value.role >= 100)
  const userId = computed(() => user.value?.id ?? -1)
  const username = computed(() => user.value?.username ?? '')
  const displayName = computed(() => user.value?.display_name || user.value?.username || '')

  // Actions
  function setUser(userData: User) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearUser() {
    user.value = null
    localStorage.removeItem('user')
  }

  function loadUserFromStorage() {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
        localStorage.removeItem('user')
      }
    }
  }

  function login(userData: User) {
    setUser(userData)
  }

  function logout() {
    clearUser()
    isUserFetched.value = false
  }

  // 从后端获取当前用户信息
  async function fetchUserSelf(): Promise<User | null> {
    if (isLoading.value) return user.value
    
    isLoading.value = true
    try {
      const res = await API.get('/api/user/self')
      if (res.data.success && res.data.data) {
        const userData = res.data.data
        setUser(userData)
        isUserFetched.value = true
        return userData
      }
    } catch (error) {
      console.error('Failed to fetch user self:', error)
    } finally {
      isLoading.value = false
    }
    return null
  }

  // 确保用户信息已加载（如果已登录但还未获取最新数据）
  async function ensureUserLoaded(): Promise<User | null> {
    if (!isLoggedIn.value) return null
    if (isUserFetched.value && user.value) return user.value
    return await fetchUserSelf()
  }

  // 初始化时从 localStorage 加载用户
  loadUserFromStorage()

  return {
    // State
    user,
    isLoading,
    isUserFetched,
    // Getters
    isLoggedIn,
    isAdmin,
    isRoot,
    userId,
    username,
    displayName,
    // Actions
    setUser,
    clearUser,
    loadUserFromStorage,
    login,
    logout,
    fetchUserSelf,
    ensureUserLoaded
  }
})
