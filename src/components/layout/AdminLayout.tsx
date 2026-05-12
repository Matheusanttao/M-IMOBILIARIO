import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { NotificationBell } from '@/components/admin/NotificationBell'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end border-b border-slate-100 bg-white px-4 py-2 lg:px-6">
          <NotificationBell />
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}
