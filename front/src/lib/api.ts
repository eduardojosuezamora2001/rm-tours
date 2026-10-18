export class ApiError extends Error {
  code: string
  details: string[]
  constructor(code: string, details: string[] = []) {
    super(code)
    this.code = code
    this.details = details
  }
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
  admin = false,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD'].includes((options.method ?? 'GET').toUpperCase()))
    headers.set('X-RM-Request', '1')
  let response: Response
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      headers,
      credentials: 'same-origin',
      cache: admin ? 'no-store' : 'default',
    })
  } catch {
    throw new ApiError('GENERIC')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    if (admin && response.status === 401 && path !== '/admin/session')
      window.dispatchEvent(new Event('admin-session-expired'))
    throw new ApiError(body.error?.code ?? 'GENERIC', body.error?.details)
  }
  return response.status === 204 || response.status === 202 ? (undefined as T) : response.json()
}
