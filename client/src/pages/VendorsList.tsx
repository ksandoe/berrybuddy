import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

type Vendor = {
  vendor_id: string
  vendor_name: string
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
  quality_score?: number | null
  last_update?: string | null
}

type Berry = {
  berry_id: string
  berry_name: string
}

export default function VendorsList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [berries, setBerries] = useState<Berry[]>([])

  // filter UI state
  const [berryId, setBerryId] = useState<string>('')
  const [minQuality, setMinQuality] = useState<string>('')
  const [applyKey, setApplyKey] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'distance'|'quality'|'price'|'none'>('none')
  const origin = { lat: 39.7285, lon: -121.8375 } // Chico, CA

  // initial load of berries for filter dropdown
  useEffect(() => {
    let mounted = true
    apiGet<Berry[]>('/berries')
      .then((data) => { if (mounted) setBerries(data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    if (berryId) params.set('berry_id', berryId)
    const qs = params.toString()
    apiGet<Vendor[]>(`/vendors${qs ? `?${qs}` : ''}`)
      .then((data) => { if (mounted) setVendors(data) })
      .catch((e) => { if (mounted) setError(e.message || 'Error loading vendors') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [applyKey, berryId])

  // No geolocation; distances are computed from Chico, CA

  if (loading) return <div className="container py-6">Loading vendors…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  const filtered = vendors.filter(v => {
    const qualityOk = minQuality ? ((v.quality_score ?? -1) >= Number(minQuality)) : true
    // TODO: berryId filter requires API support to know vendor-berry relation
    return qualityOk
  })

  function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const R = 6371000
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLon = (b.lon - a.lon) * Math.PI / 180
    const la1 = a.lat * Math.PI / 180
    const la2 = b.lat * Math.PI / 180
    const sinDLat = Math.sin(dLat / 2)
    const sinDLon = Math.sin(dLon / 2)
    const h = sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLon * sinDLon
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'quality') {
      return (b.quality_score ?? -Infinity) - (a.quality_score ?? -Infinity)
    }
    if (sortBy === 'distance') {
      const da = (typeof a.latitude === 'number' && typeof a.longitude === 'number') ? haversineMeters(origin, { lat: a.latitude!, lon: a.longitude! }) : Infinity
      const db = (typeof b.latitude === 'number' && typeof b.longitude === 'number') ? haversineMeters(origin, { lat: b.latitude!, lon: b.longitude! }) : Infinity
      return da - db
    }
    // price placeholder until API provides price field on /vendors
    return 0
  })

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold mb-4">Vendors</h1>
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div>
          <label className="block text-sm mb-1">Berry</label>
          {/** Radix Select items cannot have empty string values. Use __all internally to represent no filter. */}
          <Select
            value={berryId === '' ? '__all' : berryId}
            onValueChange={(v) => setBerryId(v === '__all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All berries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All</SelectItem>
              {berries.map(b => (
                <SelectItem key={b.berry_id} value={b.berry_id}>{b.berry_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1">Min quality</label>
          <Input type="number" min={0} max={5} step={0.1} value={minQuality} onChange={(e) => setMinQuality(e.target.value)} placeholder="e.g. 4" />
        </div>
        <div>
          <label className="block text-sm mb-1">Sort by</label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="price" disabled>Price (coming soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => { setLoading(true); setApplyKey((k) => k + 1) }}>Apply</Button>
          <Button variant="outline" onClick={() => { setMinQuality(''); setBerryId(''); setApplyKey((k) => k + 1) }}>Clear</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {sorted.map(v => (
          <Card key={v.vendor_id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{v.vendor_name}</span>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/vendors/${v.vendor_id}`}>Details</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                {(v.city || v.state) ? `${v.city ?? ''}${v.city && v.state ? ', ' : ''}${v.state ?? ''}` : '—'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {(() => {
                const parts: string[] = []
                parts.push(`Quality: ${v.quality_score ?? '—'}`)
                parts.push(`Last update: ${v.last_update ? new Date(v.last_update).toLocaleString() : '—'}`)
                if (typeof v.latitude === 'number' && typeof v.longitude === 'number') {
                  const d = haversineMeters(origin, { lat: v.latitude, lon: v.longitude })
                  const distStr = d >= 1000 ? `${(d/1000).toFixed(1)} km` : `${Math.round(d)} m`
                  parts.push(`Distance from Chico: ${distStr}`)
                }
                return parts.join(' · ')
              })()}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
