import { ref } from 'vue'

export function useGeolocation() {
  const latitude = ref<number | null>(null)
  const longitude = ref<number | null>(null)
  const accuracy = ref<number | null>(null)
  const updatedAt = ref<string | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  function clearLocation() {
    latitude.value = null
    longitude.value = null
    accuracy.value = null
    updatedAt.value = null
    error.value = null
  }

  async function requestLocation() {
    if (!('geolocation' in navigator)) {
      error.value = 'Geolocation tidak didukung browser ini.'
      return
    }

    isLoading.value = true
    error.value = null

    const enableHighAccuracy =
      (import.meta.env.VITE_GEOLOCATION_ENABLE_HIGH_ACCURACY ?? 'true').toLowerCase() === 'true'
    const timeout = Number(import.meta.env.VITE_GEOLOCATION_TIMEOUT_MS ?? 10000)

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude.value = position.coords.latitude
          longitude.value = position.coords.longitude
          accuracy.value = position.coords.accuracy
          updatedAt.value = new Date(position.timestamp).toISOString()
          resolve()
        },
        (geoError) => {
          error.value = geoError.message
          resolve()
        },
        {
          enableHighAccuracy,
          maximumAge: 0,
          timeout,
        },
      )
    })

    isLoading.value = false
  }

  return {
    latitude,
    longitude,
    accuracy,
    updatedAt,
    error,
    isLoading,
    clearLocation,
    requestLocation,
  }
}
