'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  set as dateFnsSet,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { VisitaRow, ImovelRow, LeadRow } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

type VisitaWithRels = VisitaRow & {
  imoveis?: { titulo: string } | null
  leads?: { name: string } | null
}

const STATUS_CFG: Record<
  VisitaRow['status'],
  { label: string; dot: string; badge: string }
> = {
  agendada: {
    label: 'Agendada',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  realizada: {
    label: 'Realizada',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelada: {
    label: 'Cancelada',
    dot: 'bg-red-400',
    badge: 'bg-red-50 text-red-600 border-red-200',
  },
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AdminAgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [visitas, setVisitas] = useState<VisitaWithRels[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editVisita, setEditVisita] = useState<VisitaWithRels | null>(null)

  const [imoveis, setImoveis] = useState<Pick<ImovelRow, 'id' | 'titulo'>[]>([])
  const [leads, setLeads] = useState<Pick<LeadRow, 'id' | 'name'>[]>([])

  const supabase = useMemo(() => createClient(), [])

  const loadVisitas = useCallback(async () => {
    setLoading(true)
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const { data, error } = await supabase
      .from('visitas')
      .select('*, imoveis ( titulo ), leads ( name )')
      .gte('data_hora', start.toISOString())
      .lte('data_hora', end.toISOString())
      .order('data_hora', { ascending: true })
    if (!error && data) setVisitas(data as VisitaWithRels[])
    setLoading(false)
  }, [supabase, currentMonth])

  const loadDropdowns = useCallback(async () => {
    const [imRes, ldRes] = await Promise.all([
      supabase
        .from('imoveis')
        .select('id, titulo')
        .eq('status', 'disponivel')
        .order('titulo'),
      supabase.from('leads').select('id, name').order('name'),
    ])
    if (imRes.data) setImoveis(imRes.data)
    if (ldRes.data) setLeads(ldRes.data)
  }, [supabase])

  useEffect(() => {
    loadVisitas()
  }, [loadVisitas])

  useEffect(() => {
    loadDropdowns()
  }, [loadDropdowns])

  const visitasByDay = useMemo(() => {
    const map = new Map<string, VisitaWithRels[]>()
    for (const v of visitas) {
      const key = format(parseISO(v.data_hora), 'yyyy-MM-dd')
      const arr = map.get(key) ?? []
      arr.push(v)
      map.set(key, arr)
    }
    return map
  }, [visitas])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { locale: ptBR }),
      end: endOfWeek(monthEnd, { locale: ptBR }),
    })
  }, [currentMonth])

  const dayVisitas = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, 'yyyy-MM-dd')
    return visitasByDay.get(key) ?? []
  }, [selectedDay, visitasByDay])

  const handlePrev = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1))

  const openCreate = (day?: Date) => {
    setSelectedDay(day ?? selectedDay)
    setCreateOpen(true)
  }

  const handleCreated = () => {
    setCreateOpen(false)
    loadVisitas()
  }

  const handleUpdated = () => {
    setEditVisita(null)
    loadVisitas()
  }

  const counts = useMemo(() => {
    let agendada = 0
    let realizada = 0
    let cancelada = 0
    for (const v of visitas) {
      if (v.status === 'agendada') agendada++
      else if (v.status === 'realizada') realizada++
      else cancelada++
    }
    return { agendada, realizada, cancelada, total: visitas.length }
  }, [visitas])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Agenda</h1>
          <p className="mt-1 text-muted">Calendário de visitas aos imóveis.</p>
        </div>
        <Button onClick={() => openCreate(new Date())}>
          <Plus className="size-4" />
          Nova visita
        </Button>
      </div>

      {/* Summary counters */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: counts.total, color: 'text-primary' },
          { label: 'Agendadas', value: counts.agendada, color: 'text-blue-600' },
          { label: 'Realizadas', value: counts.realizada, color: 'text-emerald-600' },
          { label: 'Canceladas', value: counts.cancelada, color: 'text-red-500' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-md">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
          <button
            onClick={handlePrev}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <ChevronLeft className="size-5 text-primary" />
          </button>
          <h2 className="font-display text-lg font-semibold capitalize text-primary">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={handleNext}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <ChevronRight className="size-5 text-primary" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold uppercase text-muted"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayVisits = visitasByDay.get(key) ?? []
            const inMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)
            const selected = selectedDay ? isSameDay(day, selectedDay) : false

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`relative flex min-h-[72px] flex-col items-start border-b border-r border-slate-50 p-1.5 text-left transition sm:min-h-[90px] sm:p-2 ${
                  !inMonth ? 'bg-slate-50/60' : 'hover:bg-blue-50/40'
                } ${selected ? 'ring-2 ring-inset ring-accent' : ''}`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm font-medium ${
                    today
                      ? 'bg-primary text-white'
                      : inMonth
                        ? 'text-slate-700'
                        : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayVisits.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayVisits.slice(0, 4).map((v) => (
                      <span
                        key={v.id}
                        title={`${format(parseISO(v.data_hora), 'HH:mm')} — ${v.imoveis?.titulo ?? 'Imóvel'}`}
                        className={`size-2.5 rounded-full ${STATUS_CFG[v.status].dot}`}
                      />
                    ))}
                    {dayVisits.length > 4 && (
                      <span className="text-[10px] leading-none text-muted">
                        +{dayVisits.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-primary">
              {format(selectedDay, "dd 'de' MMMM, EEEE", { locale: ptBR })}
            </h3>
            <Button size="sm" onClick={() => openCreate(selectedDay)}>
              <Plus className="size-4" />
              Agendar
            </Button>
          </div>

          {loading ? (
            <p className="mt-4 text-center text-muted">Carregando…</p>
          ) : dayVisitas.length === 0 ? (
            <p className="mt-4 text-center text-muted">
              Nenhuma visita neste dia.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dayVisitas.map((v) => (
                <li
                  key={v.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-surface/60 p-3 transition hover:shadow-sm"
                  onClick={() => setEditVisita(v)}
                >
                  <div
                    className={`mt-1 size-3 shrink-0 rounded-full ${STATUS_CFG[v.status].dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted" />
                      <span className="text-sm font-medium text-slate-800">
                        {format(parseISO(v.data_hora), 'HH:mm')}
                      </span>
                      <Badge
                        className={`ml-auto text-[10px] ${STATUS_CFG[v.status].badge}`}
                      >
                        {STATUS_CFG[v.status].label}
                      </Badge>
                    </div>
                    {v.imoveis?.titulo && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="size-3.5 text-muted" />
                        {v.imoveis.titulo}
                      </p>
                    )}
                    {v.leads?.name && (
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                        <User className="size-3.5 text-muted" />
                        {v.leads.name}
                      </p>
                    )}
                    {v.observacoes && (
                      <p className="mt-1 text-xs text-muted line-clamp-1">
                        {v.observacoes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Create modal */}
      <CreateVisitaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        day={selectedDay ?? new Date()}
        imoveis={imoveis}
        leads={leads}
        supabase={supabase}
      />

      {/* Edit modal */}
      {editVisita && (
        <EditVisitaModal
          open
          onClose={() => setEditVisita(null)}
          onUpdated={handleUpdated}
          visita={editVisita}
          supabase={supabase}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Create visit modal                                                */
/* ------------------------------------------------------------------ */

function CreateVisitaModal({
  open,
  onClose,
  onCreated,
  day,
  imoveis,
  leads,
  supabase,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  day: Date
  imoveis: Pick<ImovelRow, 'id' | 'titulo'>[]
  leads: Pick<LeadRow, 'id' | 'name'>[]
  supabase: ReturnType<typeof createClient>
}) {
  const [time, setTime] = useState('10:00')
  const [imovelId, setImovelId] = useState('')
  const [leadId, setLeadId] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTime('10:00')
      setImovelId('')
      setLeadId('')
      setObs('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!imovelId) {
      setError('Selecione um imóvel.')
      return
    }
    setSaving(true)
    setError(null)

    const [h, m] = time.split(':').map(Number)
    const dataHora = dateFnsSet(day, {
      hours: h,
      minutes: m,
      seconds: 0,
      milliseconds: 0,
    })

    const { error: dbErr } = await supabase.from('visitas').insert({
      imovel_id: imovelId,
      lead_id: leadId || null,
      data_hora: dataHora.toISOString(),
      status: 'agendada',
      observacoes: obs || null,
    })

    setSaving(false)
    if (dbErr) {
      setError(dbErr.message)
      return
    }
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova visita">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <CalendarDays className="size-4" />
          {format(day, "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>

        <Input
          label="Horário"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <Select
          label="Imóvel"
          placeholder="Selecione o imóvel"
          value={imovelId}
          onChange={(e) => setImovelId(e.target.value)}
          options={imoveis.map((i) => ({ value: i.id, label: i.titulo }))}
        />

        <Select
          label="Lead (opcional)"
          placeholder="Nenhum"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={[
            { value: '', label: 'Nenhum' },
            ...leads.map((l) => ({ value: l.id, label: l.name })),
          ]}
        />

        <Textarea
          label="Observações"
          placeholder="Detalhes sobre a visita…"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Agendar visita
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit / view visit modal                                           */
/* ------------------------------------------------------------------ */

function EditVisitaModal({
  open,
  onClose,
  onUpdated,
  visita,
  supabase,
}: {
  open: boolean
  onClose: () => void
  onUpdated: () => void
  visita: VisitaWithRels
  supabase: ReturnType<typeof createClient>
}) {
  const [status, setStatus] = useState<VisitaRow['status']>(visita.status)
  const [obs, setObs] = useState(visita.observacoes ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setStatus(visita.status)
    setObs(visita.observacoes ?? '')
    setError(null)
    setConfirmDelete(false)
  }, [visita])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error: dbErr } = await supabase
      .from('visitas')
      .update({ status, observacoes: obs || null })
      .eq('id', visita.id)
    setSaving(false)
    if (dbErr) {
      setError(dbErr.message)
      return
    }
    onUpdated()
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    const { error: dbErr } = await supabase
      .from('visitas')
      .delete()
      .eq('id', visita.id)
    setDeleting(false)
    if (dbErr) {
      setError(dbErr.message)
      return
    }
    onUpdated()
  }

  const dataHora = parseISO(visita.data_hora)

  return (
    <Modal open={open} onClose={onClose} title="Detalhes da visita">
      <div className="space-y-4">
        {/* Read-only info */}
        <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="flex items-center gap-2 text-slate-700">
            <CalendarDays className="size-4 text-muted" />
            {format(dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          {visita.imoveis?.titulo && (
            <p className="flex items-center gap-2 text-slate-700">
              <MapPin className="size-4 text-muted" />
              {visita.imoveis.titulo}
            </p>
          )}
          {visita.leads?.name && (
            <p className="flex items-center gap-2 text-slate-700">
              <User className="size-4 text-muted" />
              {visita.leads.name}
            </p>
          )}
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as VisitaRow['status'])}
          options={[
            { value: 'agendada', label: 'Agendada' },
            { value: 'realizada', label: 'Realizada' },
            { value: 'cancelada', label: 'Cancelada' },
          ]}
        />

        <Textarea
          label="Observações"
          placeholder="Detalhes sobre a visita…"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
          >
            <Trash2 className="size-4" />
            {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
