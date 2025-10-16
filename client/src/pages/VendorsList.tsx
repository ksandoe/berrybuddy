import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function VendorsList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiGet<Vendor[]>('/vendors')
      .then((data) => { if (mounted) setVendors(data) })
      .catch((e) => { if (mounted) setError(e.message || 'Error loading vendors') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="container py-6">Loading vendors…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold mb-4">Vendors</h1>
      <ul className="space-y-3">
        {vendors.map(v => (
          <li key={v.vendor_id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{v.vendor_name}</div>
              <div className="text-sm text-gray-500">
                {(v.city || v.state) ? `${v.city ?? ''}${v.city && v.state ? ', ' : ''}${v.state ?? ''}` : '—'}
              </div>
              <div className="text-sm text-gray-600">
                Quality: {v.quality_score ?? '—'} · Last update: {v.last_update ? new Date(v.last_update).toLocaleString() : '—'}
              </div>
            </div>
            <Link to={`/vendors/${v.vendor_id}`} className="text-primary hover:underline">Details</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
