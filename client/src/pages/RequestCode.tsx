import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function RequestCode() {
  const { signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithOtp(email, true)
      setSent(true)
      toast({ title: 'Code sent', description: 'Check your email for the OTP.' })
      navigate(`/auth/verify?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || 'Failed to request code')
      toast({ title: 'Request failed', description: err.message || 'Failed to request code', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md py-10">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
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
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {sent && <div className="text-green-600 text-sm">Code sent. Check your email.</div>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send code'}
        </Button>
      </form>
    </div>
  )
}
