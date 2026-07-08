import { createRouter, createWebHistory } from 'vue-router'

import AttendanceView from '@/modules/attendance/views/AttendanceView.vue'
import RequestPermissionView from '@/modules/requests/views/RequestPermissionView.vue'
import LeaveRequestView from '@/modules/leave/views/LeaveRequestView.vue'
import HistoryView from '@/modules/history/views/HistoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/attendance',
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: AttendanceView,
    },
    {
      path: '/permission',
      name: 'permission',
      component: RequestPermissionView,
    },
    {
      path: '/leave',
      name: 'leave',
      component: LeaveRequestView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
  ],
})

export default router
