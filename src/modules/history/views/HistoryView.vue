<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { fetchAttendanceHistory } from '@/api/attendance'
import SectionCard from '@/components/common/SectionCard.vue'
import type { AttendanceHistoryItem } from '@/types/api'

const employeeId = ref('')
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const records = ref<AttendanceHistoryItem[]>([])
const page = ref(1)
const pageSize = ref(8)
const selectedRecord = ref<AttendanceHistoryItem | null>(null)

const hasRecords = computed(() => records.value.length > 0)

const filteredRecords = computed(() => {
  return records.value.filter((record) => {
    const timestamp = new Date(record.check_time_utc)

    if (Number.isNaN(timestamp.getTime())) {
      return true
    }

    if (startDate.value) {
      const start = new Date(`${startDate.value}T00:00:00`)
      if (timestamp < start) {
        return false
      }
    }

    if (endDate.value) {
      const end = new Date(`${endDate.value}T23:59:59`)
      if (timestamp > end) {
        return false
      }
    }

    return true
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRecords.value.length / pageSize.value))
})

const paginatedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

watch(filteredRecords, () => {
  page.value = 1
})

watch(totalPages, (value) => {
  if (page.value > value) {
    page.value = value
  }
})

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

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

async function loadHistory() {
  loading.value = true
  error.value = null

  try {
    const response = await fetchAttendanceHistory(employeeId.value || undefined)
    records.value = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat riwayat absensi.'
  } finally {
    loading.value = false
  }
}

function openDetail(record: AttendanceHistoryItem) {
  selectedRecord.value = record
}

function closeDetail() {
  selectedRecord.value = null
}

function clearDateFilter() {
  startDate.value = ''
  endDate.value = ''
}

function goPrevPage() {
  page.value = Math.max(1, page.value - 1)
}

function goNextPage() {
  page.value = Math.min(totalPages.value, page.value + 1)
}

onMounted(async () => {
  await loadHistory()
})
</script>

<template>
  <div class="space-y-4">
    <SectionCard
      title="Riwayat Absensi"
      subtitle="Riwayat checkin/checkout beserta data GPS dari backend."
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label class="space-y-1 text-sm font-semibold text-slate-700">
          Filter Employee ID
          <input
            v-model="employeeId"
            type="text"
            placeholder="Contoh: EMP001"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
        <label class="space-y-1 text-sm font-semibold text-slate-700">
          Tanggal Mulai
          <input
            v-model="startDate"
            type="date"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
        <label class="space-y-1 text-sm font-semibold text-slate-700">
          Tanggal Akhir
          <input
            v-model="endDate"
            type="date"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:self-end">
          <button
            type="button"
            class="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
            @click="clearDateFilter"
          >
            Reset Tanggal
          </button>
        </div>
        <button
          type="button"
          class="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300 sm:self-end"
          :disabled="loading"
          @click="loadHistory"
        >
          {{ loading ? 'Memuat...' : 'Muat Riwayat' }}
        </button>
      </div>

      <p v-if="error" class="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {{ error }}
      </p>

      <div v-if="!loading && hasRecords" class="mt-4 space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <p>Total data: {{ filteredRecords.length }}</p>
          <p>Halaman {{ page }} / {{ totalPages }}</p>
        </div>

        <article
          v-for="record in paginatedRecords"
          :key="record.id"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-bold text-slate-900">
              {{ record.employee_id }}
              <span
                class="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700"
              >
                {{ record.status }}
              </span>
            </p>
            <p class="text-xs text-slate-500">{{ formatDate(record.check_time_utc) }}</p>
          </div>

          <div class="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <p>Similarity: {{ record.similarity ?? '-' }}</p>
            <p>Confidence: {{ record.confidence ?? '-' }}</p>
            <p>Latitude: {{ record.latitude ?? '-' }}</p>
            <p>Longitude: {{ record.longitude ?? '-' }}</p>
            <p>GPS Accuracy: {{ record.gps_accuracy_meters ?? '-' }}</p>
            <p>Provider: {{ record.gps_provider ?? '-' }}</p>
          </div>

          <p class="mt-3">
            <span
              class="rounded-full px-2 py-1 text-xs font-semibold"
              :class="locationStatusUi(record.location_status).className"
            >
              {{ locationStatusUi(record.location_status).label }}
            </span>
          </p>

          <button
            type="button"
            class="mt-3 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
            @click="openDetail(record)"
          >
            Detail
          </button>
        </article>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="page <= 1"
            @click="goPrevPage"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            class="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="page >= totalPages"
            @click="goNextPage"
          >
            Berikutnya
          </button>
        </div>
      </div>

      <p v-else-if="!loading" class="mt-4 text-sm text-slate-500">
        Belum ada data riwayat untuk filter saat ini.
      </p>
    </SectionCard>

    <div
      v-if="selectedRecord"
      class="fixed inset-0 z-40 flex items-end bg-slate-900/40 p-3 sm:items-center sm:justify-center"
      @click.self="closeDetail"
    >
      <section class="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
        <header class="mb-3 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-900">Detail Attendance Event</h3>
          <button
            type="button"
            class="rounded-xl bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
            @click="closeDetail"
          >
            Tutup
          </button>
        </header>

        <div class="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p>ID: {{ selectedRecord.id }}</p>
          <p>Employee: {{ selectedRecord.employee_id }}</p>
          <p>Status: {{ selectedRecord.status }}</p>
          <p>Waktu: {{ formatDate(selectedRecord.check_time_utc) }}</p>
          <p>Similarity: {{ selectedRecord.similarity ?? '-' }}</p>
          <p>Confidence: {{ selectedRecord.confidence ?? '-' }}</p>
          <p>Latitude: {{ selectedRecord.latitude ?? '-' }}</p>
          <p>Longitude: {{ selectedRecord.longitude ?? '-' }}</p>
          <p>GPS Accuracy: {{ selectedRecord.gps_accuracy_meters ?? '-' }}</p>
          <p>GPS Provider: {{ selectedRecord.gps_provider ?? '-' }}</p>
        </div>

        <p class="mt-3">
          <span
            class="rounded-full px-2 py-1 text-xs font-semibold"
            :class="locationStatusUi(selectedRecord.location_status).className"
          >
            {{ locationStatusUi(selectedRecord.location_status).label }}
          </span>
        </p>
      </section>
    </div>
  </div>
</template>
