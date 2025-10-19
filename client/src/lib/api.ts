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

export async function apiAuthedFormWithProgress<T>(path: string, form: FormData, onProgress?: (pct: number) => void, method: 'POST'|'PUT' = 'POST'): Promise<T> {
  const headers = await authHeader()
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, `${API_BASE}${path}`)
    // set auth header if present
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, String(v)))
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return
        const pct = Math.round((e.loaded / e.total) * 100)
        onProgress(pct)
      }
    }
    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300
      if (!ok) return reject(new Error(xhr.responseText || `HTTP ${xhr.status}`))
      try { resolve(JSON.parse(xhr.responseText)) } catch { resolve(undefined as unknown as T) }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(form)
  })
}
