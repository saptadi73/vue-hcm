<script setup lang="ts">
interface Props {
  brightnessScore: number
  blurScore: number
  accepted: boolean
  reasons: string[]
}

defineProps<Props>()

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>

<template>
  <section class="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-700">Quality Gate</h3>
      <span
        class="rounded-full px-3 py-1 text-xs font-semibold"
        :class="accepted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
      >
        {{ accepted ? 'Ready' : 'Perlu Perbaikan' }}
      </span>
    </div>

    <div class="mt-3 space-y-2 text-xs text-slate-600">
      <p>
        Brightness: <strong>{{ toPercent(brightnessScore) }}</strong>
      </p>
      <p>
        Sharpness: <strong>{{ toPercent(blurScore) }}</strong>
      </p>
      <p v-if="reasons.length">{{ reasons[0] }}</p>
      <p v-else>Kualitas frame cukup untuk verifikasi.</p>
    </div>
  </section>
</template>
