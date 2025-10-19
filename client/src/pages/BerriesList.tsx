import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import { Link } from 'react-router-dom'

type Berry = {
  berry_id: string
  berry_name: string
  created_at?: string | null
}

export default function BerriesList() {
  const [berries, setBerries] = useState<Berry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewAgg, setReviewAgg] = useState<Record<string, { count: number; latest?: string }>>({})

  useEffect(() => {
    let mounted = true
    apiGet<Berry[]>('/berries')
      .then((data) => { if (mounted) setBerries(data) })
      .catch((e) => { if (mounted) setError(e.message || 'Error loading berries') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    type Review = { berry_id: string; created_at?: string | null }
    apiGet<Review[]>('/reviews')
      .then((all) => {
        if (!mounted) return
        const agg: Record<string, { count: number; latest?: string }> = {}
        for (const r of all) {
          const id = r.berry_id
          if (!id) continue
          if (!agg[id]) agg[id] = { count: 0, latest: undefined }
          agg[id].count += 1
          const ts = r.created_at || undefined
          if (ts) {
            if (!agg[id].latest || Date.parse(ts) > Date.parse(agg[id].latest)) {
              agg[id].latest = ts
            }
          }
        }
        setReviewAgg(agg)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="container py-6">Loading berries…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold mb-4">Berries</h1>
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {berries.map(b => {
          const agg = reviewAgg[b.berry_id]
          const latestStr = agg?.latest ? new Date(agg.latest).toLocaleString() : '—'
          const count = agg?.count ?? 0
          return (
            <li key={b.berry_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{b.berry_name}</div>
                <Link to={`/berries/${b.berry_id}`} className="text-blue-600 underline text-sm">Details</Link>
              </div>
              <div className="text-sm text-gray-500 mt-1">Reviews: {count}</div>
              <div className="text-sm text-gray-500">Most recent: {latestStr}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
