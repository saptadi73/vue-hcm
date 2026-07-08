<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  stream: MediaStream | null
  error: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  mounted: [element: HTMLVideoElement | null]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

onMounted(() => {
  emit('mounted', videoRef.value)
})
</script>

<template>
  <section
    class="relative overflow-hidden rounded-3xl bg-slate-900 shadow-lg ring-1 ring-cyan-100/20"
  >
    <video
      ref="videoRef"
      autoplay
      muted
      playsinline
      class="h-88 w-full object-cover sm:h-100"
    ></video>

    <slot />

    <div
      v-if="error"
      class="absolute inset-x-2 top-2 rounded-xl bg-rose-500/90 px-3 py-2 text-xs font-semibold text-white"
    >
      {{ error }}
    </div>

    <div
      v-if="!stream"
      class="absolute inset-0 grid place-items-center bg-slate-900/70 text-sm font-semibold text-cyan-100"
    >
      Kamera belum aktif
    </div>
  </section>
</template>
