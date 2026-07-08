<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import CameraPreview from '@/components/camera/CameraPreview.vue'
import FaceGuideOverlay from '@/components/camera/FaceGuideOverlay.vue'
import QualityIndicator from '@/components/camera/QualityIndicator.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import { useCamera } from '@/composables/useCamera'
import { useGeolocation } from '@/composables/useGeolocation'
import { useQualityCheck, type QualityCheckResult } from '@/composables/useQualityCheck'
import { useAttendanceStore } from '@/stores/attendance.store'

const attendanceStore = useAttendanceStore()
const {
  stream,
  isReady,
  isLoading: cameraLoading,
  error: cameraError,
  videoElement,
  attachVideoElement,
  startCamera,
  stopCamera,
  captureFrame,
} = useCamera()
const {
  latitude,
  longitude,
  accuracy,
  updatedAt,
  error: geolocationError,
  isLoading: geolocationLoading,
  clearLocation,
  requestLocation,
} = useGeolocation()
const { evaluateFromVideo } = useQualityCheck()

const deviceCode = ref('CAM-001')
const quality = ref<QualityCheckResult>({
  accepted: false,
  brightnessScore: 0,
  blurScore: 0,
  reasons: ['Kamera belum dianalisis'],
})

let qualityIntervalId: number | null = null

const hasLocation = computed(() => latitude.value !== null && longitude.value !== null)

const gpsAccuracyLevel = computed<'excellent' | 'warning' | 'poor' | 'unknown'>(() => {
  if (!hasLocation.value || accuracy.value === null) {
    return 'unknown'
  }

  if (accuracy.value <= 20) {
    return 'excellent'
  }

  if (accuracy.value <= 50) {
    return 'warning'
  }

  return 'poor'
})

const gpsBadge = computed(() => {
  if (geolocationError.value) {
    const denied = geolocationError.value.toLowerCase().includes('denied')
    return {
      label: denied ? 'GPS denied' : 'GPS error',
      className: 'bg-rose-100 text-rose-700',
    }
  }

  if (gpsAccuracyLevel.value === 'excellent') {
    return { label: 'GPS ready', className: 'bg-emerald-100 text-emerald-700' }
  }

  if (gpsAccuracyLevel.value === 'warning') {
    return { label: 'GPS fair', className: 'bg-amber-100 text-amber-700' }
  }

  if (gpsAccuracyLevel.value === 'poor') {
    return { label: 'Low accuracy', className: 'bg-rose-100 text-rose-700' }
  }

  return { label: 'GPS not ready', className: 'bg-slate-100 text-slate-700' }
})

function locationStatusUi(status?: string | null): { label: string; className: string } {
  const normalized = (status ?? '').toLowerCase()

  if (!normalized) {
    return { label: 'Unknown', className: 'bg-slate-100 text-slate-700' }
  }

  if (
    normalized.includes('inside') ||
    normalized.includes('valid') ||
    normalized.includes('allowed')
  ) {
    return { label: status ?? 'Valid', className: 'bg-emerald-100 text-emerald-700' }
  }

  if (
    normalized.includes('outside') ||
    normalized.includes('invalid') ||
    normalized.includes('blocked')
  ) {
    return { label: status ?? 'Invalid', className: 'bg-rose-100 text-rose-700' }
  }

  return { label: status ?? 'Unknown', className: 'bg-amber-100 text-amber-700' }
}

const canSubmitAttendance = computed(() => {
  if (attendanceStore.loading || !isReady.value || !deviceCode.value.trim()) {
    return false
  }

  if (!hasLocation.value || geolocationError.value) {
    return false
  }

  if (!quality.value.accepted) {
    return false
  }

  if (gpsAccuracyLevel.value === 'poor') {
    return false
  }

  return true
})

async function runQualityAnalysis() {
  if (!videoElement.value || !isReady.value) {
    return
  }

  quality.value = await evaluateFromVideo(videoElement.value)
}

async function initCameraAndLocation() {
  await startCamera()
  await requestLocation()
  await runQualityAnalysis()

  if (qualityIntervalId !== null) {
    window.clearInterval(qualityIntervalId)
  }

  qualityIntervalId = window.setInterval(() => {
    void runQualityAnalysis()
  }, 1300)
}

async function submitAttendance() {
  if (!canSubmitAttendance.value) {
    return
  }

  try {
    attendanceStore.clearError()
    const frame = await captureFrame()

    await attendanceStore.runAttendance({
      deviceCode: deviceCode.value.trim(),
      imageBase64: frame.imageBase64,
      latitude: latitude.value,
      longitude: longitude.value,
      gpsAccuracyMeters: accuracy.value,
      gpsProvider: 'browser',
    })
  } catch {
    // Error is handled in store state.
  }
}

onMounted(async () => {
  await initCameraAndLocation()
})

onBeforeUnmount(() => {
  if (qualityIntervalId !== null) {
    window.clearInterval(qualityIntervalId)
  }

  stopCamera()
  clearLocation()
})
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <section
      class="rounded-3xl bg-linear-to-r from-cyan-700 via-teal-700 to-blue-700 p-5 text-white shadow-lg"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Face Attendance</p>
      <h2 class="mt-2 text-2xl font-black sm:text-3xl">Absensi Wajah + GPS Evidence</h2>
      <p class="mt-2 text-sm text-cyan-100">
        Frontend mengirim metadata GPS ke backend. Validasi radius dilakukan oleh Odoo/FastAPI.
      </p>
    </section>

    <SectionCard
      title="Data Absensi"
      subtitle="Lengkapi perangkat dan tipe absensi sebelum capture."
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="space-y-1 text-sm font-semibold text-slate-700">
          Device Code
          <input
            v-model="deviceCode"
            type="text"
            placeholder="CAM-001"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        <label class="space-y-1 text-sm font-semibold text-slate-700">
          Tipe Absensi
          <select
            :value="attendanceStore.actionType"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            @change="
              attendanceStore.setActionType(
                ($event.target as HTMLSelectElement).value as 'checkin' | 'checkout',
              )
            "
          >
            <option value="checkin">Check In</option>
            <option value="checkout">Check Out</option>
          </select>
        </label>
      </div>
    </SectionCard>

    <div class="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <div class="space-y-4">
        <CameraPreview :stream="stream" :error="cameraError" @mounted="attachVideoElement">
          <FaceGuideOverlay />
        </CameraPreview>

        <div class="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            class="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
            :disabled="cameraLoading"
            @click="initCameraAndLocation"
          >
            {{ cameraLoading ? 'Menyalakan...' : 'Aktifkan Kamera' }}
          </button>
          <button
            type="button"
            class="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            :disabled="geolocationLoading"
            @click="requestLocation"
          >
            {{ geolocationLoading ? 'Mendeteksi...' : 'Refresh GPS' }}
          </button>
          <button
            type="button"
            class="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            :disabled="!canSubmitAttendance"
            @click="submitAttendance"
          >
            {{
              attendanceStore.loading
                ? 'Mengirim...'
                : attendanceStore.actionType === 'checkin'
                  ? 'Check In Sekarang'
                  : 'Check Out Sekarang'
            }}
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <QualityIndicator
          :accepted="quality.accepted"
          :brightness-score="quality.brightnessScore"
          :blur-score="quality.blurScore"
          :reasons="quality.reasons"
        />

        <SectionCard title="Lokasi GPS" subtitle="Koordinat wajib terkirim saat request absensi.">
          <div class="space-y-2 text-sm text-slate-600">
            <p>
              <span class="font-semibold text-slate-800">Status GPS:</span>
              <span
                class="ml-2 rounded-full px-2 py-1 text-xs font-semibold"
                :class="gpsBadge.className"
              >
                {{ gpsBadge.label }}
              </span>
            </p>
            <p>
              <span class="font-semibold text-slate-800">Latitude:</span>
              {{ latitude ?? '-' }}
            </p>
            <p>
              <span class="font-semibold text-slate-800">Longitude:</span>
              {{ longitude ?? '-' }}
            </p>
            <p>
              <span class="font-semibold text-slate-800">Akurasi:</span>
              {{ accuracy ? `${Math.round(accuracy)} m` : '-' }}
            </p>
            <p>
              <span class="font-semibold text-slate-800">Updated:</span>
              {{ updatedAt ? new Date(updatedAt).toLocaleTimeString('id-ID') : '-' }}
            </p>
            <p v-if="geolocationError" class="text-rose-600">{{ geolocationError }}</p>
            <p
              v-if="gpsAccuracyLevel === 'poor'"
              class="rounded-xl bg-amber-50 px-3 py-2 text-amber-700"
            >
              Akurasi GPS di atas 50m. Silakan refresh lokasi sebelum submit absensi.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Validasi Lokasi"
          subtitle="Odoo/FastAPI menentukan valid atau tidaknya radius lokasi berdasarkan koordinat yang dikirim."
        >
          <div class="space-y-2 text-sm text-slate-600">
            <p>Frontend tidak menghitung radius sendiri sesuai kontrak backend terbaru.</p>
            <p>
              Server akan mengembalikan hasil validasi lokasi pada response attendance/integrasi
              Odoo.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Hasil Absensi"
          subtitle="Feedback hasil verifikasi wajah dan status attendance terbaru."
        >
          <div v-if="attendanceStore.lastResult" class="space-y-2 text-sm text-slate-700">
            <p>
              <span class="font-semibold">Matched:</span>
              {{ attendanceStore.lastResult.matched ? 'Ya' : 'Tidak' }}
            </p>
            <p>
              <span class="font-semibold">Employee:</span>
              {{ attendanceStore.lastResult.employee_id ?? '-' }}
            </p>
            <p>
              <span class="font-semibold">Similarity:</span>
              {{ attendanceStore.lastResult.similarity ?? '-' }}
            </p>
            <p>
              <span class="font-semibold">Status:</span>
              {{ attendanceStore.lastResult.status }}
            </p>
            <p>
              <span class="font-semibold">GPS Terkirim:</span>
              {{ attendanceStore.lastResult.latitude ?? '-' }},
              {{ attendanceStore.lastResult.longitude ?? '-' }}
            </p>
            <p>
              <span class="font-semibold">GPS Accuracy:</span>
              {{ attendanceStore.lastResult.gps_accuracy_meters ?? '-' }}
            </p>
            <p v-if="attendanceStore.lastResult.location_status">
              <span class="font-semibold">Location Status:</span>
              <span
                class="ml-2 rounded-full px-2 py-1 text-xs font-semibold"
                :class="locationStatusUi(attendanceStore.lastResult.location_status).className"
              >
                {{ locationStatusUi(attendanceStore.lastResult.location_status).label }}
              </span>
            </p>
          </div>
          <p v-else class="text-sm text-slate-500">Belum ada hasil absensi.</p>

          <p
            v-if="attendanceStore.error"
            class="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {{ attendanceStore.error }}
          </p>
        </SectionCard>
      </div>
    </div>
  </div>
</template>
