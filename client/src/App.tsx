import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import VendorsList from '@/pages/VendorsList'
import BerriesList from '@/pages/BerriesList'
import VendorDetail from '@/pages/VendorDetail'
import Profile from '@/pages/Profile'
import RequestCode from '@/pages/RequestCode'
import VerifyCode from '@/pages/VerifyCode'
import { Toaster } from '@/components/ui/toaster'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'

function AuthedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="container py-6">Loading…</div>
  return session ? children : <Navigate to="/auth/request" replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6" />
            <span className="font-semibold">Berry Buddy</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/berries">Berries</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/vendors">Vendors</Link>
            </Button>
            {session ? (
              <Button asChild size="sm">
                <Link to="/profile">Profile</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth/request">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/vendors" replace />} />
          <Route path="/berries" element={<BerriesList />} />
          <Route path="/vendors" element={<VendorsList />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />
          <Route path="/auth/request" element={<RequestCode />} />
          <Route path="/auth/verify" element={<VerifyCode />} />
          <Route
            path="/profile"
            element={
              <AuthedRoute>
                <Profile />
              </AuthedRoute>
            }
          />
        </Routes>
      </Layout>
      <Toaster />
    </AuthProvider>
  )
}
