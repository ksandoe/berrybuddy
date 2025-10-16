import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import VendorsList from '@/pages/VendorsList'
import BerriesList from '@/pages/BerriesList'
import VendorDetail from '@/pages/VendorDetail'
import Profile from '@/pages/Profile'
import RequestCode from '@/pages/RequestCode'
import VerifyCode from '@/pages/VerifyCode'

function AuthedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="container py-6">Loading…</div>
  return session ? children : <Navigate to="/auth/request" replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold text-primary">Berry Buddy</Link>
          <nav className="flex gap-4">
            <Link to="/berries" className="hover:underline">Berries</Link>
            <Link to="/vendors" className="hover:underline">Vendors</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
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
    </AuthProvider>
  )
}
