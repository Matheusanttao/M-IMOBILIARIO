import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { AdminSessionTimeout } from '@/components/admin/AdminSessionTimeout'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <AdminSessionTimeout />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <div className="flex-1 overflow-auto p-4 sm:p-5 lg:p-7">{children}</div>
      </div>
    </div>
  )
}
