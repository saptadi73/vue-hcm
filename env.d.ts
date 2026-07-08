/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CAPTURE_FORMAT?: string
  readonly VITE_CAPTURE_QUALITY?: string
  readonly VITE_REQUEST_TIMEOUT_MS?: string
  readonly VITE_GEOLOCATION_ENABLE_HIGH_ACCURACY?: string
  readonly VITE_GEOLOCATION_TIMEOUT_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
