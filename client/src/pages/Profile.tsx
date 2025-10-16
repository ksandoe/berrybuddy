import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  async function onSignOut() {
    try {
      await signOut()
      toast({ title: 'Signed out' })
    } catch (err: any) {
      toast({ title: 'Sign out failed', description: err.message || 'Please try again.', variant: 'destructive' })
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      {user ? (
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <Button onClick={onSignOut}>Sign out</Button>
        </div>
      ) : (
        <div>Not signed in.</div>
      )}
    </div>
  )
}
