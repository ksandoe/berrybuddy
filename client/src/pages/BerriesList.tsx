import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

type Berry = {
  berry_id: string
  berry_name: string
  created_at?: string | null
}

export default function BerriesList() {
  const [berries, setBerries] = useState<Berry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiGet<Berry[]>('/berries')
      .then((data) => { if (mounted) setBerries(data) })
      .catch((e) => { if (mounted) setError(e.message || 'Error loading berries') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="container py-6">Loading berries…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold mb-4">Berries</h1>
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {berries.map(b => (
          <li key={b.berry_id} className="border rounded-lg p-4">
            <div className="font-medium">{b.berry_name}</div>
            <div className="text-sm text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
