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
  const [city, setCity] = useState<string>('')
  const [minQuality, setMinQuality] = useState<string>('')
  const [applyKey, setApplyKey] = useState<number>(0)

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

  if (loading) return <div className="container py-6">Loading vendors…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  // client-side filtering (API does not accept filters yet)
  const filtered = vendors.filter(v => {
    const cityOk = city ? (`${v.city ?? ''} ${v.state ?? ''}`.toLowerCase().includes(city.toLowerCase())) : true
    const qualityOk = minQuality ? ((v.quality_score ?? -1) >= Number(minQuality)) : true
    // TODO: berryId filter requires API support to know vendor-berry relation
    return cityOk && qualityOk
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
          <label className="block text-sm mb-1">City</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Seattle" />
        </div>
        <div>
          <label className="block text-sm mb-1">Min quality</label>
          <Input type="number" min={0} max={5} step={0.1} value={minQuality} onChange={(e) => setMinQuality(e.target.value)} placeholder="e.g. 4" />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => { setLoading(true); setApplyKey((k) => k + 1) }}>Apply</Button>
          <Button variant="outline" onClick={() => { setCity(''); setMinQuality(''); setBerryId(''); setApplyKey((k) => k + 1) }}>Clear</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(v => (
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
              Quality: {v.quality_score ?? '—'} · Last update: {v.last_update ? new Date(v.last_update).toLocaleString() : '—'}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
