import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { loginToOdoo } from '@/api/auth'
import type { AuthLoginRequest, AuthLoginResponseData } from '@/types/api'

const AUTH_STORAGE_KEY = 'hcm-auth-session'

function readStoredSession(): AuthLoginResponseData | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthLoginResponseData
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function writeStoredSession(session: AuthLoginResponseData) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

export const useAuthStore = defineStore('auth', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const session = ref<AuthLoginResponseData | null>(readStoredSession())

  const isAuthenticated = computed(() => session.value !== null)
  const userDisplayName = computed(() => {
    return session.value?.employee?.name ?? session.value?.name ?? session.value?.username ?? 'User'
  })
  const userSecondaryText = computed(() => {
    if (!session.value) {
      return null
    }

    return session.value.employee?.work_email ?? session.value.username ?? null
  })

  const tenantLabel = computed(() => {
    if (!session.value) {
      return null
    }

    return [session.value.odoo_db, session.value.odoo_base_url].filter(Boolean).join(' @ ')
  })

  function hydrateFromStorage() {
    session.value = readStoredSession()
  }

  async function login(payload: AuthLoginRequest) {
    loading.value = true
    error.value = null

    try {
      const response = await loginToOdoo({
        username: payload.username.trim(),
        password: payload.password,
        odoo_base_url: payload.odoo_base_url?.trim() || undefined,
        odoo_db: payload.odoo_db?.trim() || undefined,
      })

      session.value = response.data
      writeStoredSession(response.data)
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login gagal'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout(message?: string) {
    session.value = null
    error.value = message ?? null
    clearStoredSession()
  }

  function clearError() {
    error.value = null
  }

  return {
    loading,
    error,
    session,
    isAuthenticated,
    userDisplayName,
    userSecondaryText,
    tenantLabel,
    hydrateFromStorage,
    login,
    logout,
    clearError,
  }
})
