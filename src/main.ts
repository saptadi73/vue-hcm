import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'

import App from './App.vue'
import './assets/main.css'
import { registerUnauthorizedHandler } from './api/client'
import router from './router'
import { useAuthStore } from './stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

registerUnauthorizedHandler(async () => {
  const authStore = useAuthStore(pinia)

  if (!authStore.isAuthenticated) {
    return
  }

  authStore.logout('Sesi login berakhir. Silakan login kembali.')

  const currentRoute = router.currentRoute.value
  if (currentRoute.path !== '/login') {
    await router.push({
      path: '/login',
      query: {
        reason: 'session-expired',
        redirect: currentRoute.fullPath,
      },
    })
  }
})

app.use(pinia)
app.use(VueApexCharts)
app.use(router)

app.mount('#app')
