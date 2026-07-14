// ============ HTTP 客户端 ============

const BASE_URL = '/api'

// 内存中的 token 缓存
let token: string | null = localStorage.getItem('ai_job_auth_token')

export function setToken(t: string | null) {
  token = t
  if (t) {
    localStorage.setItem('ai_job_auth_token', t)
  } else {
    localStorage.removeItem('ai_job_auth_token')
  }
}

export function getToken(): string | null {
  return token
}

// ============ AI Key 管理 ============

const AI_KEY_STORAGE = 'ai_job_ai_key'

let aiKey: string | null = localStorage.getItem(AI_KEY_STORAGE)

export function setAIKey(key: string | null) {
  aiKey = key
  if (key) {
    localStorage.setItem(AI_KEY_STORAGE, key)
  } else {
    localStorage.removeItem(AI_KEY_STORAGE)
  }
}

export function getAIKey(): string | null {
  return aiKey
}

export function isAIKeyConfigured(): boolean {
  return !!aiKey
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // 仅在请求有 body 时设置 Content-Type，避免 DELETE/GET 等无 body 请求触发 CORS 预检失败
  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (aiKey) {
    headers['X-AI-Key'] = aiKey
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | undefined>) => {
    let url = path
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.append(k, v)
      })
      const qs = searchParams.toString()
      if (qs) url += `?${qs}`
    }
    return request<T>(url)
  },
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}