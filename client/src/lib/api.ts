const API_BASE = import.meta.env.VITE_API_BASE as string

export async function authHeader(): Promise<HeadersInit> {
  try {
    const mod = await import('./supabase')
    const { supabase } = mod
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export async function apiGet<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  } as HeadersInit
  const res = await fetch(`${API_BASE}${path}`, { ...opts, method: 'GET', headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiAuthed<T>(method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE', path: string, body?: any): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(await authHeader()) }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiAuthedForm<T>(path: string, form: FormData, method: 'POST'|'PUT' = 'POST'): Promise<T> {
  const headers: HeadersInit = { ...(await authHeader()) }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
