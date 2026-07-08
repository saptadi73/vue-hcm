<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { label: 'Absensi', path: '/attendance' },
  { label: 'Ijin', path: '/permission' },
  { label: 'Cuti', path: '/leave' },
  { label: 'Riwayat', path: '/history' },
]

const pageTitle = computed(() => {
  const found = menuItems.find((item) => route.path.startsWith(item.path))
  return found?.label ?? 'HCM'
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <div
      class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(14,116,144,0.15),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(30,64,175,0.16),transparent_35%)]"
    ></div>

    <header
      class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6"
    >
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
            HCM Mobile
          </p>
          <h1 class="text-lg font-black text-slate-900">{{ pageTitle }}</h1>
        </div>
        <p class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          Odoo 14 Connected
        </p>
      </div>
    </header>

    <div class="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
      <aside class="hidden w-44 shrink-0 lg:block">
        <nav
          class="space-y-2 rounded-3xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm"
        >
          <RouterLink
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="block rounded-2xl px-3 py-2 text-sm font-semibold transition"
            :class="
              route.path.startsWith(item.path)
                ? 'bg-cyan-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            "
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>

    <nav
      class="fixed inset-x-3 bottom-3 z-30 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-slate-200 backdrop-blur lg:hidden"
    >
      <ul class="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
        <li v-for="item in menuItems" :key="item.path">
          <RouterLink
            :to="item.path"
            class="block rounded-xl px-2 py-2 transition"
            :class="
              route.path.startsWith(item.path)
                ? 'bg-cyan-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            "
          >
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
