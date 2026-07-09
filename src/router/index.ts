import { createRouter, createWebHistory } from 'vue-router'

import AttendanceView from '@/modules/attendance/views/AttendanceView.vue'
import LoginView from '@/modules/auth/views/LoginView.vue'
import RequestPermissionView from '@/modules/requests/views/RequestPermissionView.vue'
import LeaveRequestView from '@/modules/leave/views/LeaveRequestView.vue'
import HistoryView from '@/modules/history/views/HistoryView.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: AttendanceView,
      meta: { requiresAuth: true },
    },
    {
      path: '/permission',
      name: 'permission',
      component: RequestPermissionView,
      meta: { requiresAuth: true },
    },
    {
      path: '/leave',
      name: 'leave',
      component: LeaveRequestView,
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.hydrateFromStorage()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: '/attendance' }
  }

  return true
})

export default router
