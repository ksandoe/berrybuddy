import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet, apiAuthed, apiAuthedForm, apiAuthedFormWithProgress } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/use-toast'
import { Star } from 'lucide-react'

type AppProfile = {
  id: string
  display_name?: string | null
}

type Review = {
  review_id: string
  rating: number
  comment?: string | null
  review_text?: string | null
  created_at?: string | null
  user_id?: string | null
  reported_by?: string | null
}

type Photo = {
  photo_id: string
  url?: string
  photo_url?: string
  thumbnail?: string | null
  review_id?: string | null
  vendor_id?: string | null
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
  const { session } = useAuth()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const origin = { lat: 39.7285, lon: -121.8375 }
  const [reviews, setReviews] = useState<Review[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [berries, setBerries] = useState<{ berry_id: string; berry_name: string }[]>([])
  const [berryId, setBerryId] = useState<string>('')
  const [visitedDate, setVisitedDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [priceTier, setPriceTier] = useState<number>(3) // 1=$ (cheap) ... 5=$$$$$ (expensive)
  const [priceNote, setPriceNote] = useState<string>('') // optional price text separate from comment
  const [priceInput, setPriceInput] = useState<string>('')
  const [unitType, setUnitType] = useState<'pound'|'kg'|'pint'|'quart'|'container'|'each'|''>('')
  const [profilesMap, setProfilesMap] = useState<Record<string, AppProfile>>({})
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState<number>(0)

  function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n}`}
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star className={n <= value ? 'h-5 w-5 text-yellow-500' : 'h-5 w-5 text-gray-300'} />
          </button>
        ))}
      </div>
    )
  }

  function onFileSelected(f: File | null) {
    if (!f) { setFile(null); return }
    const isImage = f.type.startsWith('image/')
    const underLimit = f.size <= 10 * 1024 * 1024 // 10MB, matches server limit
    if (!isImage) {
      toast({ title: 'Unsupported file', description: 'Please select an image file.' })
      setFile(null)
      return
    }
    if (!underLimit) {
      toast({ title: 'File too large', description: 'Max size is 10MB.' })
      setFile(null)
      return
    }
    setFile(f)
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

  useEffect(() => {
    let mounted = true
    apiGet<Vendor>(`/vendors/${id}`)
      .then((data) => { if (mounted) setVendor(data) })
      .catch((e) => { if (mounted) setError(e.message || 'Error loading vendor') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    let mounted = true
    apiGet<{ berry_id: string; berry_name: string }[]>(`/berries`)
      .then((data) => { if (mounted) setBerries(data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!vendor) return
    setReviews(vendor.recent_reviews ?? [])
  }, [vendor])

  // Load photos for this vendor to associate thumbnails with reviews
  useEffect(() => {
    let mounted = true
    if (!id) return
    apiGet<Photo[]>(`/photos?limit=100&offset=0`)
      .then((data) => {
        if (!mounted) return
        const filtered = (data || []).filter(p => p.vendor_id === id)
        setAllPhotos(filtered)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [id, vendor])

  // Load reviewer profiles for current reviews
  useEffect(() => {
    let mounted = true
    const ids = Array.from(new Set(reviews.map(r => (r.reported_by || r.user_id || '').trim()).filter(Boolean)))
    if (ids.length === 0) return
    apiGet<AppProfile[]>(`/profiles?ids=${encodeURIComponent(ids.join(','))}`)
      .then((profiles) => {
        if (!mounted) return
        const pm: Record<string, AppProfile> = {}
        profiles.forEach(p => { pm[p.id] = p })
        setProfilesMap(pm)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [reviews])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    if (!session) {
      toast({ title: 'Sign in required', description: 'Please sign in to post a review.' })
      return
    }
    try {
      setSubmitting(true)
      if (!berryId) throw new Error('Please select a berry')
      // Build review_text by combining comment, optional price note, and optional numeric price/unit
      const priceLine = (priceInput.trim() && unitType) ? `Price: $${Number(priceInput).toFixed(2)} per ${unitType}` : ''
      const combinedText = [
        comment?.trim() ? comment.trim() : '',
        priceNote?.trim() ? `(Price note) ${priceNote.trim()}` : '',
        priceLine,
      ].filter(Boolean).join('\n') || undefined

      const body: any = {
        vendor_id: id,
        berry_id: berryId,
        rating, // overall equals quality for now
        quality_rating: rating,
        freshness_rating: rating,
        value_rating: Math.max(1, Math.min(5, 6 - priceTier)), // cheaper ($=1) => higher value (5)
        review_text: combinedText,
        visited_date: visitedDate,
      }
      const created = await apiAuthed<Review>('POST', '/reviews', body)
      setReviews((r) => [created, ...r])
      // If a photo URL was provided, attach photo to this review
      const trimmedPhoto = photoUrl.trim()
      if (trimmedPhoto) {
        try {
          const photoBody: any = {
            vendor_id: id,
            berry_id: berryId,
            review_id: created.review_id,
            photo_url: trimmedPhoto,
          }
          const createdPhoto = await apiAuthed<Photo>('POST', '/photos', photoBody)
          setAllPhotos((p) => [{
            photo_id: createdPhoto.photo_id,
            vendor_id: id,
            review_id: created.review_id,
            photo_url: createdPhoto.photo_url || trimmedPhoto,
            thumbnail: createdPhoto.thumbnail ?? null,
            url: createdPhoto.url,
          }, ...p])
        } catch (err: any) {
          toast({ title: 'Photo URL failed to save', description: String(err?.message || err) })
        }
      }

      // If a file was selected, upload it
      if (file) {
        try {
          const form = new FormData()
          form.append('file', file)
          form.append('vendor_id', id)
          if (berryId) form.append('berry_id', berryId)
          form.append('review_id', created.review_id)
          setUploadPct(0)
          const createdPhoto = await apiAuthedFormWithProgress<Photo>('/photos/upload', form, (pct) => setUploadPct(pct), 'POST')
          setAllPhotos((p) => [{
            photo_id: createdPhoto.photo_id,
            vendor_id: id,
            review_id: created.review_id,
            photo_url: createdPhoto.photo_url,
            thumbnail: createdPhoto.thumbnail ?? null,
            url: createdPhoto.url,
          }, ...p])
        } catch (err: any) {
          toast({ title: 'Photo upload failed', description: String(err?.message || err) })
        } finally {
          setUploadPct(0)
        }
      }
      setComment('')
      setPhotoUrl('')
      setBerryId('')
      setVisitedDate(new Date().toISOString().slice(0,10))
      setRating(5)
      setPriceTier(3)
      setPriceNote('')
      setPriceInput('')
      setUnitType('')
      setFile(null)
      toast({ title: 'Review posted' })
    } catch (err: any) {
      toast({ title: 'Failed to post review', description: String(err?.message || err) })
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const userId = session?.user?.id
  const hasTodayReview = !!(userId && reviews.some(r => (r.user_id === userId || r.reported_by === userId) && (r.created_at || '').slice(0,10) === today))
  const sorted = [...reviews].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0
    const tb = b.created_at ? Date.parse(b.created_at) : 0
    return tb - ta
  })

  function photoThumbForReview(reviewId: string) {
    const p = allPhotos.find(ph => (ph.review_id || '') === reviewId)
    const thumb = p?.thumbnail || p?.url || p?.photo_url
    return thumb || null
  }

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
          {(() => {
            const parts: string[] = []
            parts.push(`Quality: ${vendor.quality_score ?? '—'}`)
            parts.push(`Last update: ${vendor.last_update ? new Date(vendor.last_update).toLocaleString() : '—'}`)
            if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
              const d = haversineMeters(origin, { lat: vendor.latitude, lon: vendor.longitude })
              const distStr = d >= 1000 ? `${(d/1000).toFixed(1)} km` : `${Math.round(d)} m`
              parts.push(`Distance from Chico: ${distStr}`)
            }
            return parts.join(' · ')
          })()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <Button onClick={() => setShowReviewModal(true)} size="sm" className="text-lg px-3" aria-label="Add review">+</Button>
      </div>

      {sorted.length > 0 ? (
        <ul className="space-y-3">
          {sorted.map(r => (
            <li key={r.review_id} className="border rounded-md p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">Rating: {r.rating}/5</div>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Reviewer: {(() => {
                  const rid = (r.reported_by || r.user_id) || ''
                  const prof = rid ? profilesMap[rid] : undefined
                  return prof?.display_name || (rid ? rid.slice(0,8) : 'Anonymous')
                })()}
                {' · '}{r.created_at ? new Date(r.created_at).toLocaleString() : ''}
              </div>
              {((r.review_text ?? r.comment) ?? '').length > 0 && <div className="text-sm mt-1">{r.review_text ?? r.comment}</div>}
              {(() => {
                const thumb = photoThumbForReview(r.review_id)
                return thumb ? (
                  <div className="mt-2">
                    <img src={thumb} alt="Review" className="w-28 h-28 object-cover rounded-md cursor-pointer" onClick={() => setPreviewUrl(thumb)} />
                  </div>
                ) : null
              })()}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground">No reviews yet.</div>
      )}

      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-xl" aria-describedby="review-dialog-desc">
          <DialogHeader>
            <DialogTitle>Add a review</DialogTitle>
            <DialogDescription id="review-dialog-desc">Post a review with optional photo.</DialogDescription>
          </DialogHeader>
          {session ? (
            <form onSubmit={(e) => { submitReview(e); }} className="space-y-4">
              {/* Rating row */}
              <div>
                <label className="block text-sm mb-1">Rating</label>
                <RatingStars value={rating} onChange={setRating} />
              </div>

              {/* Berry + Visited date row */}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Berry</label>
                  <select className="w-full rounded-md border px-3 py-2 text-sm" value={berryId} onChange={(e) => setBerryId(e.target.value)}>
                    <option value="">Select a berry</option>
                    {berries.map(b => (
                      <option key={b.berry_id} value={b.berry_id}>{b.berry_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Visited date</label>
                  <Input type="date" value={visitedDate} onChange={(e) => setVisitedDate(e.target.value)} />
                </div>
              </div>

              {/* Comment row */}
              <div>
                <label className="block text-sm mb-1">Comment</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Optional short review" />
              </div>

              {/* Price row */}
              <div>
                <label className="block text-sm mb-1">Price</label>
                <div className="flex flex-wrap items-center gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className={`px-2 py-1 border rounded text-xs ${priceTier===n?'bg-gray-900 text-white':'bg-white'}`} onClick={() => setPriceTier(n)} aria-label={`${'$'.repeat(n)}`}>
                      {'$'.repeat(n)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price note row */}
              <div>
                <label className="block text-sm mb-1">Price note (optional)</label>
                <Input value={priceNote} onChange={(e) => setPriceNote(e.target.value)} placeholder="e.g. $6 / pint" />
              </div>

              {/* Image upload row */}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Upload photo (optional)</label>
                  <input type="file" accept="image/*" onChange={(e) => onFileSelected(e.target.files?.[0] || null)} className="block w-full text-sm" />
                  {file && <div className="text-xs text-muted-foreground mt-1">Selected: {file.name}</div>}
                  {uploadPct > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">Uploading… {uploadPct}%</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Photo URL (optional)</label>
                  <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://...jpg" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting || hasTodayReview || !berryId}>Post review</Button>
                {hasTodayReview && (
                  <div className="text-xs text-muted-foreground">You already posted a review today for this vendor.</div>
                )}
              </div>
            </form>
          ) : (
            <div className="text-sm text-muted-foreground">Sign in to post a review.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-xl" aria-describedby="photo-dialog-desc">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
            <DialogDescription id="photo-dialog-desc">Full-size photo preview.</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Vendor preview" className="w-full h-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
