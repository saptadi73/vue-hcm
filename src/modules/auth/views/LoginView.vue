<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SectionCard from '@/components/common/SectionCard.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const sessionExpiredMessage = computed(() => {
  return route.query.reason === 'session-expired'
    ? 'Sesi login berakhir atau tidak lagi valid. Silakan login kembali.'
    : null
})

const form = reactive({
  username: '',
  password: '',
  odooBaseUrl: '',
  odooDb: '',
})

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  return '/attendance'
})

const canSubmit = computed(() => {
  return !authStore.loading && form.username.trim().length > 0 && form.password.length > 0
})

async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  try {
    authStore.clearError()

    await authStore.login({
      username: form.username,
      password: form.password,
      odoo_base_url: form.odooBaseUrl,
      odoo_db: form.odooDb,
    })

    await router.replace(redirectTarget.value)
  } catch {
    // Error is already exposed through the store.
  }
}
</script>

<template>
  <div
    class="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
  >
    <section
      class="space-y-4 rounded-4xl bg-linear-to-br from-cyan-700 via-sky-700 to-blue-800 p-6 text-white shadow-xl sm:p-8"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">Odoo Access</p>
      <h2 class="max-w-md text-3xl font-black leading-tight sm:text-4xl">
        Login untuk sinkronisasi absensi ke sisi Odoo.
      </h2>
      <p class="max-w-xl text-sm leading-6 text-cyan-100 sm:text-base">
        Gunakan akun Odoo Anda. Frontend akan mengirim credential ke FastAPI, lalu FastAPI melakukan
        autentikasi ke Odoo dan mengembalikan sesi pengguna yang sudah dipetakan ke employee.
      </p>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Step 1</p>
          <p class="mt-2 text-sm font-semibold">Masukkan akun Odoo</p>
        </div>
        <div class="rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Step 2</p>
          <p class="mt-2 text-sm font-semibold">FastAPI autentikasi ke Odoo</p>
        </div>
        <div class="rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Step 3</p>
          <p class="mt-2 text-sm font-semibold">Lanjut ke absensi wajah</p>
        </div>
      </div>
    </section>

    <SectionCard
      title="Login Odoo"
      subtitle="Field Odoo Base URL dan database boleh dikosongkan jika backend sudah punya default .env."
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <label class="block space-y-1 text-sm font-semibold text-slate-700">
          Username atau Email
          <input
            v-model="form.username"
            type="text"
            autocomplete="username"
            placeholder="user@example.com"
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        <label class="block space-y-1 text-sm font-semibold text-slate-700">
          Password
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="Masukkan password"
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-1 text-sm font-semibold text-slate-700">
            Odoo Base URL
            <input
              v-model="form.odooBaseUrl"
              type="url"
              inputmode="url"
              placeholder="http://127.0.0.1:8070"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label class="block space-y-1 text-sm font-semibold text-slate-700">
            Database Odoo
            <input
              v-model="form.odooDb"
              type="text"
              placeholder="jabung"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
        </div>

        <p
          class="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200"
        >
          Session disimpan di browser session storage agar akses ke modul absensi tetap aktif selama
          tab berjalan. Tutup tab atau logout untuk menghapus sesi lokal.
        </p>

        <p
          v-if="sessionExpiredMessage"
          class="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200"
        >
          {{ sessionExpiredMessage }}
        </p>

        <p v-if="authStore.error" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          :disabled="!canSubmit"
        >
          {{ authStore.loading ? 'Memproses login...' : 'Login ke Odoo' }}
        </button>
      </form>
    </SectionCard>
  </div>
</template>
