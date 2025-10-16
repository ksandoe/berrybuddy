import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function VerifyCode() {
  const { verifyOtp } = useAuth()
  const query = useQuery()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const e = query.get('email')
    if (e) setEmail(e)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyOtp(email, code)
      toast({ title: 'Signed in', description: 'You are now signed in.' })
      navigate('/profile', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Failed to verify code')
      toast({ title: 'Verification failed', description: err.message || 'Invalid code', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md py-10">
      <h1 className="text-2xl font-semibold mb-4">Verify code</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label className="mb-1 block">Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label className="mb-1 block">Code</Label>
          <Input
            type="text"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="tracking-widest"
            placeholder="123456"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify'}
        </Button>
      </form>
    </div>
  )
}
