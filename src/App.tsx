import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConfigBanner } from '@/components/layout/ConfigBanner'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Properties } from '@/pages/Properties'
import { PropertyDetails } from '@/pages/PropertyDetails'
import { Login } from '@/pages/admin/Login'
import { Dashboard } from '@/pages/admin/Dashboard'
import { PropertyFormPage } from '@/pages/admin/PropertyFormPage'
import { LeadsList } from '@/pages/admin/LeadsList'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigBanner />
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="imoveis" element={<Properties />} />
            <Route path="imoveis/:id" element={<PropertyDetails />} />
          </Route>

          <Route path="/admin/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="imoveis/:id" element={<PropertyFormPage />} />
            <Route path="leads" element={<LeadsList />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
