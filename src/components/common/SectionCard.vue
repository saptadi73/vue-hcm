<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <section
    class="rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm sm:p-5"
  >
    <header v-if="title || subtitle" class="mb-4">
      <h2 v-if="title" class="text-base font-bold text-slate-900">{{ title }}</h2>
      <p v-if="subtitle" class="mt-1 text-xs text-slate-500">{{ subtitle }}</p>
    </header>
    <slot />
  </section>
</template>
