# Frontend Vue Implementation Guide

Dokumen ini menjelaskan implementasi frontend Vue.js yang saat ini ada di repo dan kontrak yang dipakai untuk integrasi ke backend HCM/Odoo.

## 1. Scope Saat Ini

Frontend ini fokus pada:

- absensi wajah dengan kamera dan GPS
- riwayat absensi dengan filter employee dan tanggal
- scaffold halaman request ijin dan cuti
- shell navigasi untuk mobile dan desktop

Bagian enrollment wajah yang ada di versi lama guide ini sudah tidak dipakai di struktur repo saat ini.

## 2. Stack dan Struktur

Stack yang dipakai:

- Vue 3 + Composition API
- Vite
- Pinia
- Vue Router
- Fetch wrapper berbasis `requestApi`
- Tailwind CSS 4

Struktur yang relevan saat ini:

```text
src/
├── api/
├── components/
│   ├── camera/
│   └── common/
├── composables/
├── modules/
│   ├── attendance/
│   ├── history/
│   ├── leave/
│   └── requests/
├── router/
├── stores/
└── types/
```

## 3. Route Aktif

Router saat ini mengarah ke:

- `/attendance` untuk absensi
- `/permission` untuk request ijin
- `/leave` untuk request cuti
- `/history` untuk riwayat absensi

Root `/` redirect ke `/attendance`.

`AppShell` menyediakan navigasi desktop dan mobile, serta judul halaman berdasarkan route aktif.

## 4. Konfigurasi Environment

Environment variable yang dipakai frontend saat ini:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_REQUEST_TIMEOUT_MS=15000
VITE_CAPTURE_FORMAT=image/jpeg
VITE_CAPTURE_QUALITY=0.9
VITE_GEOLOCATION_ENABLE_HIGH_ACCURACY=true
VITE_GEOLOCATION_TIMEOUT_MS=10000
```

Catatan:

- `VITE_CAPTURE_FORMAT` dan `VITE_CAPTURE_QUALITY` dipakai oleh `useCamera()` saat membuat base64 frame.
- `VITE_GEOLOCATION_ENABLE_HIGH_ACCURACY` dan `VITE_GEOLOCATION_TIMEOUT_MS` dipakai oleh `useGeolocation()`.
- `VITE_REQUEST_TIMEOUT_MS` dipakai oleh `requestApi()`.

## 5. Kontrak API Yang Dipakai

API client saat ini memakai envelope standar:

```json
{
  "success": true,
  "code": "OK",
  "message": "Success",
  "data": {},
  "errors": null,
  "meta": null,
  "timestamp_utc": "2026-07-08T09:00:00Z"
}
```

Endpoint yang aktif di frontend:

- `POST /api/v1/attendance/checkin`
- `POST /api/v1/attendance/checkout`
- `GET /api/v1/attendance/history`

Query opsional untuk history:

- `employee_id`

Payload absensi yang dipakai:

```json
{
  "device_code": "CAM-001",
  "image_base64": "data:image/jpeg;base64,...",
  "latitude": -6.1753924,
  "longitude": 106.8271528,
  "gps_accuracy_meters": 8.75,
  "gps_provider": "browser"
}
```

Field response yang harus di-handle frontend:

- `attempt_id`
- `action`
- `matched`
- `employee_id`
- `similarity`
- `quality_score`
- `status`
- `latitude`
- `longitude`
- `gps_accuracy_meters`
- `gps_provider`
- `location_status`
- `attendance_id`
- `reason`

Field history yang dipakai di UI:

- `id`
- `employee_id`
- `status`
- `check_time_utc`
- `confidence`
- `similarity`
- `latitude`
- `longitude`
- `gps_accuracy_meters`
- `gps_provider`
- `location_status`

## 6. Alur Attendance

Alur pada [AttendanceView.vue](../modules/attendance/views/AttendanceView.vue):

1. Kamera dinyalakan saat view dimount.
2. Lokasi browser diminta bersamaan dengan kamera.
3. Quality check dijalankan berkala dari frame video.
4. User memilih `checkin` atau `checkout`.
5. Saat submit, frontend menangkap satu frame base64 dan mengirim payload attendance.
6. Hasil response ditampilkan sebagai status absensi dan evidence GPS.

Aturan UX yang saat ini diterapkan:

- submit diblok jika kamera belum ready
- submit diblok jika GPS belum tersedia
- submit diblok jika quality check belum accepted
- submit diblok jika akurasi GPS berada pada kategori poor
- frontend tidak menghitung radius validasi lokasi; backend/Odoo yang menentukan status lokasi final

## 7. Composable Yang Dipakai

### `useCamera()`

Fungsi utama:

- `startCamera(deviceId?)`
- `stopCamera()`
- `captureFrame()`
- `attachVideoElement()`

State yang diekspos:

- `stream`
- `isReady`
- `isLoading`
- `error`
- `videoElement`

Perilaku penting:

- resolusi target kamera dioptimalkan ke sekitar 720px
- `playsInline` diaktifkan
- stream dihentikan saat unmount
- `captureFrame()` menghasilkan `imageBase64`, `width`, dan `height`

### `useGeolocation()`

Fungsi utama:

- `requestLocation()`
- `clearLocation()`

State yang diekspos:

- `latitude`
- `longitude`
- `accuracy`
- `updatedAt`
- `error`
- `isLoading`

Perilaku penting:

- memakai `navigator.geolocation.getCurrentPosition()`
- `enableHighAccuracy` mengikuti env
- timeout mengikuti env
- jika geolocation tidak didukung, error ditampilkan langsung

### `useQualityCheck()`

Quality check dihitung dari frame video, dengan hasil:

- `accepted`
- `brightnessScore`
- `blurScore`
- `reasons`

Threshold yang dipakai saat ini:

- brightness terlalu rendah bila di bawah sekitar `0.28`
- brightness terlalu tinggi bila di atas sekitar `0.9`
- blur dianggap buruk bila di bawah sekitar `0.18`

## 8. State Management

Store absensi saat ini menyimpan:

- `loading`
- `error`
- `actionType`
- `lastResult`

Action yang tersedia:

- `runAttendance()`
- `setActionType()`
- `clearResult()`
- `clearError()`

Store ini hanya menangani absensi. Belum ada store enrollment, karena flow enrollment tidak ada di repo sekarang.

## 9. Implementasi History

Halaman history saat ini melakukan:

- fetch history dari backend
- filter by `employee_id`
- filter by rentang tanggal
- pagination client-side
- detail modal untuk satu record

Data lokasi di history ditampilkan apa adanya, termasuk `location_status` bila backend mengirimkannya.

## 10. Scaffold Permission dan Leave

Halaman request ijin dan cuti saat ini masih berupa scaffold terpisah agar struktur route dan layout siap untuk integrasi berikutnya.

Fokus implementasi berikutnya untuk dua modul ini adalah:

- form input yang sesuai alur Odoo
- submission ke backend/adapter yang tepat
- status approval dan history permintaan

## 11. Error Handling dan Retry

Behavior API client saat ini:

- retry maksimal 2 kali
- retry untuk timeout, network error, dan response 5xx
- tidak retry untuk error validasi 4xx
- backoff sederhana: 500ms lalu 1500ms

UX error yang disarankan untuk mengikuti implementasi sekarang:

- validation error: tampilkan pesan yang bisa langsung diperbaiki user
- network error: tampilkan fallback dan retry
- geolocation denied: blok submit dan tampilkan instruksi permission
- geolocation timeout: minta user refresh lokasi
- GPS poor: tampilkan warning dan minta ambil ulang lokasi

## 12. Interface TypeScript Yang Relevan

```ts
export interface ApiEnvelope<T> {
  success: boolean
  code: string
  message: string
  data: T
  errors: unknown
  meta: Record<string, unknown> | null
  timestamp_utc: string
}

export interface AttendanceRequest {
  device_code?: string
  image_base64: string
  latitude?: number
  longitude?: number
  gps_accuracy_meters?: number
  gps_provider?: string
}

export interface AttendanceResponseData {
  attempt_id?: number
  action?: 'checkin' | 'checkout'
  matched: boolean
  employee_id: string | null
  similarity: number | null
  quality_score?: number | null
  status: 'checkin' | 'checkout' | 'not_matched' | string
  latitude?: number | null
  longitude?: number | null
  gps_accuracy_meters?: number | null
  gps_provider?: string | null
  location_status?: string | null
  attendance_id?: number
  reason?: string
}

export interface AttendanceHistoryItem {
  id: number
  employee_id: string
  status: 'checkin' | 'checkout'
  check_time_utc: string
  confidence: number | null
  similarity?: number | null
  latitude?: number | null
  longitude?: number | null
  gps_accuracy_meters?: number | null
  gps_provider?: string | null
  location_status?: string | null
}
```

## 13. Checklist Implementasi

- absensi checkin/checkout
- kamera preview
- overlay guide wajah
- indikator kualitas kamera
- request permission lokasi
- indikator akurasi GPS
- riwayat absensi
- detail event attendance
- scaffold ijin dan cuti

## 14. Catatan Implementasi Repo Ini

- `AppShell` menyediakan layout utama, title per route, dan bottom navigation.
- `AttendanceView` adalah halaman yang paling lengkap dan sudah menggabungkan kamera, geolocation, quality check, dan submit attendance.
- `HistoryView` sudah membaca data GPS dan status lokasi dari backend.
- `RequestPermissionView` dan `LeaveRequestView` masih placeholder yang menunggu alur bisnis berikutnya.

Jika backend menambah field baru pada attendance atau history, update tipe di `src/types/api.ts` dan mapping di `src/api/attendance.ts` terlebih dahulu, lalu sesuaikan tampilan di modul terkait.

## 15. Referensi File Utama

- [src/router/index.ts](../router/index.ts) untuk daftar route aktif dan redirect root.
- [src/components/common/AppShell.vue](../components/common/AppShell.vue) untuk navigasi dan layout aplikasi.
- [src/modules/attendance/views/AttendanceView.vue](../modules/attendance/views/AttendanceView.vue) untuk flow kamera, GPS, quality check, dan submit absensi.
- [src/modules/history/views/HistoryView.vue](../modules/history/views/HistoryView.vue) untuk filter, pagination, dan detail riwayat.
- [src/stores/attendance.store.ts](../stores/attendance.store.ts) untuk state dan action submit attendance.
- [src/api/attendance.ts](../api/attendance.ts) untuk endpoint checkin, checkout, dan history.
- [src/api/client.ts](../api/client.ts) untuk request wrapper, timeout, dan retry.
- [src/types/api.ts](../types/api.ts) untuk contract response yang dipakai UI.
