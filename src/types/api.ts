export interface ApiEnvelope<T> {
  success: boolean
  code: string
  message: string
  data: T
  errors: unknown
  meta: Record<string, unknown> | null
  timestamp_utc: string
}

export interface AuthLoginRequest {
  username: string
  password: string
  odoo_base_url?: string
  odoo_db?: string
}

export interface AuthEmployeeInfo {
  id: number
  name: string
  barcode?: string | null
  work_email?: string | null
  user_id?: number | null
}

export interface AuthUserContext {
  lang?: string | null
  tz?: string | null
}

export interface AuthLoginResponseData {
  uid: number
  username: string
  name: string
  session_id: string
  odoo_base_url: string
  odoo_db: string
  employee_resolved: boolean
  employee_map_id?: number | null
  employee?: AuthEmployeeInfo | null
  user_context?: AuthUserContext | null
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
