import { LeadsKanban } from '@/components/admin/LeadsKanban'

export default function AdminLeadsPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">CRM — Leads</h1>
      <p className="mt-1 text-muted">
        Lista de contatos recebidos pelo site para acompanhamento rápido.
      </p>
      <div className="mt-8">
        <LeadsKanban />
      </div>
    </div>
  )
}
