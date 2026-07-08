import { requestApi } from '@/api/client'
import type { AttendanceHistoryItem, AttendanceRequest, AttendanceResponseData } from '@/types/api'

export type AttendanceAction = 'checkin' | 'checkout'

export function submitAttendance(action: AttendanceAction, payload: AttendanceRequest) {
  const endpoint =
    action === 'checkin' ? '/api/v1/attendance/checkin' : '/api/v1/attendance/checkout'

  return requestApi<AttendanceResponseData>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchAttendanceHistory(employeeId?: string) {
  const query = employeeId?.trim() ? `?employee_id=${encodeURIComponent(employeeId.trim())}` : ''

  return requestApi<AttendanceHistoryItem[]>(`/api/v1/attendance/history${query}`, {
    method: 'GET',
  })
}
