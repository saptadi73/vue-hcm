import { computed, ref } from 'vue'

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusM = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusM * c
}

export function useGeoFence() {
  const centerLat = ref<number | null>(null)
  const centerLon = ref<number | null>(null)
  const radiusM = ref<number | null>(null)

  const distanceM = ref<number | null>(null)

  const withinRadius = computed(() => {
    if (radiusM.value === null || distanceM.value === null) {
      return false
    }

    return distanceM.value <= radiusM.value
  })

  function setFence(centerLatitude: number, centerLongitude: number, radiusMeters: number) {
    centerLat.value = centerLatitude
    centerLon.value = centerLongitude
    radiusM.value = radiusMeters
  }

  function updateDistance(userLat: number | null, userLon: number | null) {
    if (
      userLat === null ||
      userLon === null ||
      centerLat.value === null ||
      centerLon.value === null
    ) {
      distanceM.value = null
      return
    }

    distanceM.value = haversineDistanceMeters(userLat, userLon, centerLat.value, centerLon.value)
  }

  return {
    centerLat,
    centerLon,
    radiusM,
    distanceM,
    withinRadius,
    setFence,
    updateDistance,
  }
}
