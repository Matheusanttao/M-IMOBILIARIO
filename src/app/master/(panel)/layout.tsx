import { MasterSidebar } from '@/components/master/MasterSidebar'

export default function MasterPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 lg:flex-row">
      <MasterSidebar />
      <div className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-8 text-slate-900">
        {children}
      </div>
    </div>
  )
}
