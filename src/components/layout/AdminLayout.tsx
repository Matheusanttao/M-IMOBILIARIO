import { Outlet } from 'react-router-dom'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </div>
  )
}
