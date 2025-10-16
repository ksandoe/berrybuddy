import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet } from '@/lib/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type Review = {
  review_id: string
  rating: number
  comment?: string | null
  created_at?: string | null
}

type Photo = {
  photo_id: string
  url: string
  created_at?: string | null
}

type Vendor = {
  vendor_id: string
  vendor_name: string
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
  quality_score?: number | null
  last_update?: string | null
  recent_reviews?: Review[]
  recent_photos?: Photo[]
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiGet<Vendor>(`/vendors/${id}`)
      .then((data) => { if (mounted) setVendor(data) })
      .catch((e) => { if (mounted) setError(e.message || 'Error loading vendor') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="container py-6">Loading…</div>
  if (error) return <div className="container py-6 text-red-600">{error}</div>
  if (!vendor) return <div className="container py-6">Not found</div>

  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{vendor.vendor_name}</CardTitle>
          <CardDescription>
            {vendor.city}{vendor.city && vendor.state ? ', ' : ''}{vendor.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Quality: {vendor.quality_score ?? '—'} · Last update: {vendor.last_update ? new Date(vendor.last_update).toLocaleString() : '—'}
        </CardContent>
      </Card>

      <Tabs defaultValue={vendor.recent_photos && vendor.recent_photos.length ? 'photos' : 'reviews'}>
        <TabsList>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          {vendor.recent_photos && vendor.recent_photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {vendor.recent_photos.map(p => (
                <img
                  key={p.photo_id}
                  src={p.url}
                  alt="Vendor"
                  className="w-full h-40 object-cover rounded-md cursor-pointer"
                  onClick={() => setPreviewUrl(p.url)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No photos yet.</div>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          {vendor.recent_reviews && vendor.recent_reviews.length > 0 ? (
            <ul className="space-y-3">
              {vendor.recent_reviews.map(r => (
                <li key={r.review_id} className="border rounded-md p-3">
                  <div className="font-medium">Rating: {r.rating}/5</div>
                  {r.comment && <div className="text-sm">{r.comment}</div>}
                  <div className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No reviews yet.</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Vendor preview" className="w-full h-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
