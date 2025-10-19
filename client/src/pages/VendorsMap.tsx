import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { latLngBounds } from 'leaflet'
import { apiGet } from '@/lib/api'

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

 type Review = {
  review_id: string
  vendor_id: string
  berry_id: string
  value_rating?: number | null
  review_text?: string | null
  created_at?: string | null
 }

 type Price = {
  price_id: string
  vendor_id: string
  berry_id: string
  price_per_unit: number
  unit_type: 'pound'|'kg'|'pint'|'quart'|'container'|'each'
 }

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

 function FitToVendors({ vendors }: { vendors: Vendor[] }) {
  const map = useMap()
  useEffect(() => {
    const pts = vendors
      .filter(v => typeof v.latitude === 'number' && typeof v.longitude === 'number')
      .map(v => [v.latitude as number, v.longitude as number]) as [number, number][]
    if (pts.length === 0) return
    const bounds = pts.reduce((acc, [lat, lng]) => acc.extend([lat, lng]), latLngBounds(pts[0], pts[0]))
    map.fitBounds(bounds.pad(0.2))
  }, [vendors, map])
  return null
}

 export default function VendorsMap() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null)
  const origin = { lat: 39.7285, lon: -121.8375 }
  const [berries, setBerries] = useState<Berry[]>([])
  const [berryId, setBerryId] = useState<string>('')
  const [mode, setMode] = useState<'quality'|'price'>('quality')
  const [dateRange, setDateRange] = useState<'all'|'month'|'week'|'today'>('month')
  const [bestTierByVendor, setBestTierByVendor] = useState<Record<string, number>>({}) // 1=$ (cheap) .. 5=$$$$$ (expensive)
  const [latestPriceNoteByVendor, setLatestPriceNoteByVendor] = useState<Record<string, string>>({})
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize from query params on mount
  useEffect(() => {
    const qBerry = searchParams.get('berry_id') || ''
    const qMode = (searchParams.get('mode') as 'quality'|'price'|null)
    const qDate = (searchParams.get('date') as 'all'|'month'|'week'|'today'|null)
    if (qBerry) setBerryId(qBerry)
    if (qMode === 'quality' || qMode === 'price') setMode(qMode)
    if (qDate === 'all' || qDate === 'month' || qDate === 'week' || qDate === 'today') setDateRange(qDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Write state to query params when it changes
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (berryId) {
      next.set('berry_id', berryId)
    } else {
      next.delete('berry_id')
    }
    next.set('mode', mode)
    next.set('date', dateRange)
    // Only update if changed
    const changed = next.toString() !== searchParams.toString()
    if (changed) setSearchParams(next, { replace: true })
  }, [berryId, mode, dateRange, searchParams, setSearchParams])

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
  }, [berryId])

  useEffect(() => {
    let mounted = true
    apiGet<Berry[]>('/berries')
      .then((data) => { if (mounted) setBerries(data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // Use recent reviews to derive price tiers by vendor
    let mounted = true
    apiGet<Review[]>(`/reviews?limit=100&offset=0`)
      .then((all) => {
        if (!mounted) return
        const today = Date.now()
        const windowMs = (
          dateRange === 'today' ? (24 * 60 * 60 * 1000) :
          dateRange === 'week' ? (7 * 24 * 60 * 60 * 1000) :
          dateRange === 'month' ? (30 * 24 * 60 * 60 * 1000) :
          Number.POSITIVE_INFINITY
        )
        const bestTier: Record<string, number> = {}
        const latestNote: Record<string, string> = {}
        const latestTs: Record<string, number> = {}
        for (const r of all) {
          if (berryId && r.berry_id !== berryId) continue
          const ts = r.created_at ? Date.parse(r.created_at) : 0
          if (isFinite(windowMs) && ts && (today - ts) > windowMs) continue
          // Map value_rating (1..5, higher is better value/cheaper) to price tier ($ cheap=1 .. $$$$$ expensive=5)
          const value = (r.value_rating ?? null)
          const tier = value ? Math.max(1, Math.min(5, 6 - value)) : null
          if (tier) {
            const prev = bestTier[r.vendor_id]
            if (prev === undefined || tier < prev) bestTier[r.vendor_id] = tier
          }
          const text = r.review_text || ''
          if (text && (!latestTs[r.vendor_id] || ts > latestTs[r.vendor_id])) {
            // Try to extract a concise price note line
            const line = text.split('\n').find(l => /Price:|Price note/i.test(l)) || ''
            latestNote[r.vendor_id] = line.trim()
            latestTs[r.vendor_id] = ts
          }
        }
        setBestTierByVendor(bestTier)
        setLatestPriceNoteByVendor(latestNote)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [berryId, dateRange])

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    )
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId) }
  }, [])

  const defaultCenter = useMemo<LatLngExpression>(() => [39.7285, -121.8375], [])
  const defaultZoom = 12

  if (loading) return <div className="container py-6">Loading map…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  return (
    <div className="h-[calc(100vh-56px)]">
      <div className="absolute z-[1000] left-1/2 -translate-x-1/2 top-2 bg-white/90 backdrop-blur rounded-md shadow px-3 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Berry</label>
          <select className="border rounded px-2 py-1 text-sm" value={berryId} onChange={(e) => setBerryId(e.target.value)}>
            <option value="">All</option>
            {berries.map(b => (
              <option key={b.berry_id} value={b.berry_id}>{b.berry_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Date</label>
          <select className="border rounded px-2 py-1 text-sm" value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}>
            <option value="all">All</option>
            <option value="month">Past month</option>
            <option value="week">Past week</option>
            <option value="today">Today</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Style</label>
          <div className="flex items-center gap-1 text-sm">
            <button className={`px-2 py-1 rounded ${mode==='quality'?'bg-green-600 text-white':'bg-gray-100'}`} onClick={() => setMode('quality')}>Quality</button>
            <button className={`px-2 py-1 rounded ${mode==='price'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={() => setMode('price')}>Price</button>
          </div>
        </div>
        <div className="text-xs text-gray-600 hidden md:block">
          {mode==='quality' ? 'Greener/bigger = higher quality' : 'Bluer/bigger = lower price'}
        </div>
      </div>
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Intentionally not auto-fitting to keep focus on Chico */}

        {userLoc && (
          <CircleMarker center={[userLoc.lat, userLoc.lon]} radius={6} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9 }} />
        )}

        {vendors.filter(v => typeof v.latitude === 'number' && typeof v.longitude === 'number').map(v => {
          const center: LatLngExpression = [v.latitude as number, v.longitude as number]
          const dist = haversineMeters(origin, { lat: v.latitude as number, lon: v.longitude as number })
          const distStr = dist >= 1000 ? `${(dist/1000).toFixed(1)} km` : `${Math.round(dist)} m`
          const subtitle = (v.city || v.state) ? `${v.city ?? ''}${v.city && v.state ? ', ' : ''}${v.state ?? ''}` : ''
          // Style by mode
          let radius = 8
          let color = '#16a34a'
          let fillColor = '#22c55e'
          if (mode === 'quality') {
            const q = v.quality_score ?? 0
            radius = 6 + Math.max(0, Math.min(5, q))
            // greener for higher quality
            const g = Math.round(100 + (q/5)*100)
            color = `#16a34a`
            fillColor = `#${(16).toString(16)}${(g).toString(16)}${(74).toString(16)}`
          } else {
            const tier = bestTierByVendor[v.vendor_id]
            if (typeof tier === 'number') {
              // Cheaper (tier=1) => bigger radius and deeper blue
              const score = 6 - tier // 5..1 (higher is cheaper)
              radius = 6 + (score * 1.5)
              const b = Math.round(150 + (score/5)*105)
              color = `#2563eb`
              fillColor = `#${(37).toString(16)}${(99).toString(16)}${b.toString(16)}`
            } else {
              color = '#94a3b8'
              fillColor = '#cbd5e1'
              radius = 6
            }
          }
          return (
            <CircleMarker key={v.vendor_id} center={center} radius={radius} pathOptions={{ color, fillColor, fillOpacity: 0.85 }}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-medium">{v.vendor_name}</div>
                  <div className="text-xs text-muted-foreground">{subtitle || '—'}</div>
                  <div className="text-xs">Quality: {v.quality_score ?? '—'}</div>
                  {mode==='price' && (
                    <>
                      <div className="text-xs">Price tier: {bestTierByVendor[v.vendor_id] ? '$'.repeat(bestTierByVendor[v.vendor_id]) : '—'}</div>
                      {latestPriceNoteByVendor[v.vendor_id] && (
                        <div className="text-xs">{latestPriceNoteByVendor[v.vendor_id]}</div>
                      )}
                    </>
                  )}
                  <div className="text-xs">Last update: {v.last_update ? new Date(v.last_update).toLocaleString() : '—'}</div>
                  <div className="text-xs">Distance from Chico: {distStr}</div>
                  <div className="pt-2">
                    <Link to={`/vendors/${v.vendor_id}`} className="text-sm text-blue-600 underline">View details</Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
