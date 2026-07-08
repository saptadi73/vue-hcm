import { ref } from 'vue'
import { defineStore } from 'pinia'

import { submitAttendance, type AttendanceAction } from '@/api/attendance'
import type { AttendanceResponseData } from '@/types/api'

export const useAttendanceStore = defineStore('attendance', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const actionType = ref<AttendanceAction>('checkin')
  const lastResult = ref<AttendanceResponseData | null>(null)

  async function runAttendance(payload: {
    deviceCode: string
    imageBase64: string
    latitude: number | null
    longitude: number | null
    gpsAccuracyMeters: number | null
    gpsProvider: string
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await submitAttendance(actionType.value, {
        device_code: payload.deviceCode,
        image_base64: payload.imageBase64,
        latitude: payload.latitude ?? undefined,
        longitude: payload.longitude ?? undefined,
        gps_accuracy_meters: payload.gpsAccuracyMeters ?? undefined,
        gps_provider: payload.gpsProvider,
      })

      lastResult.value = response.data
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown attendance error'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setActionType(type: AttendanceAction) {
    actionType.value = type
  }

  function clearResult() {
    lastResult.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    loading,
    error,
    actionType,
    lastResult,
    runAttendance,
    setActionType,
    clearResult,
    clearError,
  }
})
