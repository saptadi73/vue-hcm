import { requestApi } from '@/api/client'
import type { AuthLoginRequest, AuthLoginResponseData } from '@/types/api'

export function loginToOdoo(payload: AuthLoginRequest) {
  return requestApi<AuthLoginResponseData>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    suppressUnauthorizedHandler: true,
  })
}
