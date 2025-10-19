import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type Berry = {
  berry_id: string
  berry_name: string
}

type AppProfile = {
  id: string
  display_name?: string | null
}

type Vendor = {
  vendor_id: string
  vendor_name: string
}

type Review = {
  review_id: string
  vendor_id: string
  berry_id: string
  rating: number
  review_text?: string | null
  comment?: string | null
  created_at?: string | null
  user_id?: string | null
  reported_by?: string | null
}

export default function BerryDetail() {
  const { id } = useParams<{ id: string }>()
  const [berry, setBerry] = useState<Berry | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendorsMap, setVendorsMap] = useState<Record<string, Vendor>>({})
  const [profilesMap, setProfilesMap] = useState<Record<string, AppProfile>>({})

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const [berries, allReviews, vendors] = await Promise.all([
          apiGet<Berry[]>(`/berries`).catch((e) => { throw new Error(`Failed to load berries: ${e?.message || e}`) }),
          apiGet<Review[]>(`/reviews?limit=100&offset=0`).catch((e) => { throw new Error(`Failed to load reviews: ${e?.message || e}`) }),
          apiGet<Vendor[]>(`/vendors`).catch((e) => { throw new Error(`Failed to load vendors: ${e?.message || e}`) }),
        ])
        const b = berries.find(x => x.berry_id === id) || null
        if (mounted) setBerry(b)
        const filtered = allReviews.filter(r => r.berry_id === id)
        if (mounted) setReviews(filtered)
        if (mounted) {
          const map: Record<string, Vendor> = {}
          vendors.forEach(v => { map[v.vendor_id] = v })
          setVendorsMap(map)
        }

        // Load reviewer profiles
        const ids = Array.from(new Set(filtered.map(r => (r.reported_by || r.user_id || '').trim()).filter(Boolean)))
        if (ids.length > 0) {
          try {
            const profiles = await apiGet<AppProfile[]>(`/profiles?ids=${encodeURIComponent(ids.join(','))}`)
            if (mounted) {
              const pm: Record<string, AppProfile> = {}
              profiles.forEach(p => { pm[p.id] = p })
              setProfilesMap(pm)
            }
          } catch {}
        }
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e) || 'Error loading berry reviews')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) load()
    return () => { mounted = false }
  }, [id])

  const sorted = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const da = a.created_at ? Date.parse(a.created_at) : 0
      const db = b.created_at ? Date.parse(b.created_at) : 0
      return db - da
    })
  }, [reviews])

  if (loading) return <div className="container py-6">Loading…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{berry?.berry_name || 'Berry'}</CardTitle>
          <CardDescription>All reviews for this berry, newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Total reviews: {sorted.length}</div>
        </CardContent>
      </Card>

      {sorted.length > 0 ? (
        <ul className="space-y-3">
          {sorted.map(r => (
            <li key={r.review_id} className="border rounded-md p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">Rating: {r.rating}/5</div>
                <div className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Vendor: {r.vendor_id && vendorsMap[r.vendor_id] ? (
                  <Link to={`/vendors/${r.vendor_id}`} className="underline">{vendorsMap[r.vendor_id].vendor_name}</Link>
                ) : '—'}
                {' · '}Reviewer: {(() => {
                  const rid = (r.reported_by || r.user_id) || ''
                  const prof = rid ? profilesMap[rid] : undefined
                  return prof?.display_name || (rid ? rid.slice(0,8) : 'Anonymous')
                })()}
              </div>
              {((r.review_text ?? r.comment) ?? '').length > 0 && (
                <div className="text-sm mt-1">{r.review_text ?? r.comment}</div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground">No reviews for this berry yet.</div>
      )}
    </div>
  )
}
