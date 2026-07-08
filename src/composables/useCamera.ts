import { onBeforeUnmount, ref } from 'vue'

export interface CaptureFrameResult {
  imageBase64: string
  width: number
  height: number
}

export function useCamera() {
  const videoElement = ref<HTMLVideoElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function attachVideoElement(element: HTMLVideoElement | null) {
    videoElement.value = element

    if (element && stream.value) {
      element.srcObject = stream.value
    }
  }

  async function startCamera(deviceId?: string) {
    isLoading.value = true
    error.value = null

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: { ideal: 'user' },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      stream.value = mediaStream

      if (videoElement.value) {
        videoElement.value.srcObject = mediaStream
        videoElement.value.playsInline = true
        await videoElement.value.play()
      }

      isReady.value = true
    } catch (err) {
      isReady.value = false
      error.value = err instanceof Error ? err.message : 'Camera access failed'
    } finally {
      isLoading.value = false
    }
  }

  function stopCamera() {
    stream.value?.getTracks().forEach((track) => track.stop())
    stream.value = null
    isReady.value = false

    if (videoElement.value) {
      videoElement.value.srcObject = null
    }
  }

  async function captureFrame(): Promise<CaptureFrameResult> {
    if (!videoElement.value || !isReady.value) {
      throw new Error('Camera not ready')
    }

    const width = videoElement.value.videoWidth || 720
    const height = videoElement.value.videoHeight || 720

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas context not available')
    }

    context.drawImage(videoElement.value, 0, 0, width, height)

    const captureFormat = import.meta.env.VITE_CAPTURE_FORMAT ?? 'image/jpeg'
    const captureQuality = Number(import.meta.env.VITE_CAPTURE_QUALITY ?? 0.9)
    const dataUrl = canvas.toDataURL(captureFormat, captureQuality)

    return {
      imageBase64: dataUrl,
      width,
      height,
    }
  }

  onBeforeUnmount(() => {
    stopCamera()
  })

  return {
    stream,
    isReady,
    isLoading,
    error,
    videoElement,
    attachVideoElement,
    startCamera,
    stopCamera,
    captureFrame,
  }
}
