import { create } from 'zustand'
import { loadFromStorage, saveToStorage, removeFromStorage } from '@/utils/persist'
import { authApi, setToken, getToken } from '@/api'
import type { UserInfo } from '@/api'

const STORAGE_KEY = 'auth'

interface User {
  id: string
  email: string
  nickname: string
  avatar: string
  targetPosition: string
  targetIndustry: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  hasCompletedOnboarding: boolean
  init: () => Promise<void>
  completeOnboarding: () => void
  setAuth: (user: User, token: string, isNewUser?: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

// 从 localStorage 恢复登录状态
const savedAuth = loadFromStorage<{ user: User | null; isLoggedIn: boolean; hasCompletedOnboarding: boolean }>(STORAGE_KEY, {
  user: null,
  isLoggedIn: false,
  hasCompletedOnboarding: false,
})

export const useAuthStore = create<AuthState>((set) => ({
  user: savedAuth.user,
  isLoggedIn: savedAuth.isLoggedIn,
  hasCompletedOnboarding: savedAuth.hasCompletedOnboarding,

  // 标记新手引导已完成
  completeOnboarding: () => {
    set((state) => {
      const newState = { ...state, hasCompletedOnboarding: true }
      saveToStorage(STORAGE_KEY, { user: newState.user, isLoggedIn: newState.isLoggedIn, hasCompletedOnboarding: true })
      return { hasCompletedOnboarding: true }
    })
  },

  // 直接设置认证状态（用于外部 API 调用后更新 store）
  setAuth: (user, token, isNewUser = false) => {
    setToken(token)
    const state = { user, isLoggedIn: true, hasCompletedOnboarding: !isNewUser }
    saveToStorage(STORAGE_KEY, state)
    set(state)
  },

  // 初始化：有 token 时尝试从服务器恢复用户信息
  init: async () => {
    const token = getToken()
    if (!token) return
    try {
      const { user } = await authApi.getMe()
      const state = { user, isLoggedIn: true, hasCompletedOnboarding: savedAuth.hasCompletedOnboarding }
      saveToStorage(STORAGE_KEY, state)
      set(state)
    } catch {
      // API 不可用，保持 localStorage 中的用户数据
    }
  },

  // 登录：调用 API，失败时抛出错误（老用户已完成引导）
  login: async (email, password) => {
    const { user, token } = await authApi.login({ email, password })
    setToken(token)
    const state = { user, isLoggedIn: true, hasCompletedOnboarding: true }
    saveToStorage(STORAGE_KEY, state)
    set(state)
  },

  // 注册：调用 API，失败时抛出错误
  register: async (email, password, nickname) => {
    const { user, token } = await authApi.register({ email, password, nickname })
    setToken(token)
    const state = { user, isLoggedIn: true, hasCompletedOnboarding: false }
    saveToStorage(STORAGE_KEY, state)
    set(state)
  },

  // 登出：清除 token、存储和状态
  logout: () => {
    setToken(null)
    removeFromStorage(STORAGE_KEY)
    set({ user: null, isLoggedIn: false })
  },

  // 更新用户信息：本地合并 + 持久化
  updateUser: (data) =>
    set((state) => {
      const newUser = state.user ? { ...state.user, ...data } : null
      const newState = { user: newUser, isLoggedIn: !!newUser }
      saveToStorage(STORAGE_KEY, newState)
      return newState
    }),
}))

// 模块加载时自动尝试从服务器恢复用户
useAuthStore.getState().init()