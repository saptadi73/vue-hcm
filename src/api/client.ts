import type { ApiEnvelope } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 15000)
const MAX_RETRY_COUNT = 2

type UnauthorizedHandler = (status: number) => void | Promise<void>

interface ApiRequestOptions extends RequestInit {
  suppressUnauthorizedHandler?: boolean
}

let unauthorizedHandler: UnauthorizedHandler | null = null

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function shouldRetry(status: number | null, errorName: string | null): boolean {
  if (errorName === 'AbortError') {
    return true
  }

  if (status === null) {
    return true
  }

  return status >= 500
}

function isUnauthorizedStatus(status: number): boolean {
  return status === 401 || status === 403
}

export async function requestApi<T>(
  path: string,
  init: ApiRequestOptions = {},
): Promise<ApiEnvelope<T>> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      })

      const payload = (await response.json()) as ApiEnvelope<T>

      if (!response.ok) {
        if (isUnauthorizedStatus(response.status) && !init.suppressUnauthorizedHandler) {
          await unauthorizedHandler?.(response.status)
        }

        const httpError = new Error(payload.message || `HTTP ${response.status}`)
        ;(httpError as Error & { status?: number }).status = response.status
        throw httpError
      }

      return payload
    } catch (error) {
      lastError = error
      const maybeStatus = (error as Error & { status?: number }).status ?? null
      const maybeName = (error as Error).name ?? null

      if (attempt >= MAX_RETRY_COUNT || !shouldRetry(maybeStatus, maybeName)) {
        break
      }

      const backoff = attempt === 0 ? 500 : 1500
      await sleep(backoff)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown request error')
}
