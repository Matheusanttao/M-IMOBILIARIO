import { AdminLayout } from '@/components/layout/AdminLayout'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
