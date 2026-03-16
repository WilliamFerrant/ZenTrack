'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Plus, Trash2, ChevronDown, Check, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useDataStore } from '@/stores'
import type { TimeEntry, Project, Client } from '@/types'

function fmtDate(dt: string | Date) {
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface InvoiceLine {
  description: string
  hours: number
  rate: number
}

// Simple dropdown that works on the white invoice background
function InvoiceSelect<T extends { id: string | number; name: string }>({
  options, value, onChange, placeholder,
}: {
  options: T[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => String(o.id) === value)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 hover:border-gray-400 transition-colors bg-white focus:outline-none"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.name : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto">
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(String(o.id)); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <span className={value === String(o.id) ? 'text-gray-900 font-medium' : 'text-gray-600'}>{o.name}</span>
              {value === String(o.id) && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InvoicePage() {
  const router = useRouter()
  const params = useSearchParams()
  const { projects, fetchProjects, showToast } = useDataStore()

  // Toolbar state (not printed)
  const [selectedProjectId, setSelectedProjectId] = useState(params.get('project_id') ?? '')
  const [startDate, setStartDate]   = useState(params.get('start') ?? '')
  const [endDate, setEndDate]       = useState(params.get('end') ?? '')
  const [loadingEntries, setLoadingEntries] = useState(false)

  // Invoice content state
  const [clients, setClients]       = useState<Client[]>([])
  const [lines, setLines]           = useState<InvoiceLine[]>([])
  const [clientId, setClientId]     = useState(params.get('client_id') ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [invoiceDate, setInvoiceDate]     = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate]             = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10)
  })
  const [notes, setNotes] = useState('')

  const project = projects.find(p => String(p.id) === selectedProjectId)
  const client  = clients.find(c => String(c.id) === clientId)

  useEffect(() => {
    if (!projects.length) fetchProjects()
    api.get<Client[]>('/clients').then(setClients).catch(() => {})
  }, []) // eslint-disable-line

  // When project changes, auto-select its client
  useEffect(() => {
    if (project?.client_id) setClientId(String(project.client_id))
  }, [project?.client_id]) // eslint-disable-line

  // Auto-load entries when project is pre-filled from URL
  useEffect(() => {
    if (selectedProjectId) loadEntries()
  }, []) // eslint-disable-line

  const loadEntries = async () => {
    if (!selectedProjectId) {
      showToast({ type: 'warning', title: 'Select a project first' })
      return
    }
    setLoadingEntries(true)
    try {
      const q = new URLSearchParams({ limit: '500' })
      if (startDate) q.set('start_date', startDate)
      if (endDate)   q.set('end_date', endDate)
      const r = await api.get<any>(`/time-entries?project_ids=${selectedProjectId}&${q}`)
      const arr: TimeEntry[] = Array.isArray(r) ? r : (r?.entries ?? [])

      // Resolve hourly rate: entry > project
      const defaultRate = project?.hourly_rate ? Number(project.hourly_rate) : 0

      if (arr.length === 0) {
        setLines([{ description: project?.name ?? 'Work', hours: 0, rate: defaultRate }])
        showToast({ type: 'warning', title: 'No time entries found for this period' })
        return
      }

      // Group by description
      const map: Record<string, { secs: number; rate: number }> = {}
      arr.forEach(e => {
        const key = e.description?.trim() || project?.name || 'Work'
        if (!map[key]) map[key] = { secs: 0, rate: Number(e.hourly_rate ?? defaultRate) }
        map[key].secs += e.duration ?? 0
      })

      setLines(Object.entries(map).map(([desc, { secs, rate }]) => ({
        description: desc,
        hours: Math.round((secs / 3600) * 100) / 100,
        rate,
      })))
    } catch {
      showToast({ type: 'error', title: 'Failed to load time entries' })
    } finally {
      setLoadingEntries(false)
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.hours * l.rate, 0)

  const addLine    = () => setLines(prev => [...prev, { description: '', hours: 0, rate: project?.hourly_rate ? Number(project.hourly_rate) : 0 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof InvoiceLine, val: string) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: field === 'description' ? val : Number(val) } : l))

  const projectOptions = projects.map(p => ({ id: p.id, name: p.name }))
  const clientOptions  = clients.map(c => ({ id: c.id, name: c.name }))

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; }
        }
        .print-only { display: none; }
        @media print { .print-only { display: block; } }
      `}</style>

      {/* ── Toolbar (hidden on print) ── */}
      <div className="no-print flex items-center gap-3 p-4 border-b border-border/30 bg-background flex-wrap">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">Invoice Builder</span>

        <div className="flex-1 flex items-center gap-2 flex-wrap ml-2">
          {/* Project picker */}
          <div className="w-52">
            <InvoiceSelect
              options={projectOptions as any}
              value={selectedProjectId}
              onChange={v => setSelectedProjectId(v)}
              placeholder="Select project…"
            />
          </div>

          {/* Date range */}
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-border/40 bg-white/[0.04] text-foreground focus:outline-none focus:border-primary/50"
            title="Start date"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-border/40 bg-white/[0.04] text-foreground focus:outline-none focus:border-primary/50"
            title="End date"
          />

          {/* Load button */}
          <button
            onClick={loadEntries}
            disabled={loadingEntries || !selectedProjectId}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-border/40 bg-white/[0.04] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingEntries ? 'animate-spin' : ''}`} />
            Load entries
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / PDF
        </button>
      </div>

      {/* ── Invoice document ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="print-page max-w-3xl mx-auto bg-white text-gray-900 rounded-2xl shadow-xl p-10 space-y-8">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <input
                className="no-print mt-1 text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:border-gray-400 outline-none w-40"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="INV-000001"
              />
              <p className="print-only text-sm text-gray-500 mt-1">{invoiceNumber}</p>
            </div>
            <div className="text-right space-y-1 text-sm">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-gray-500">Date:</span>
                <input type="date" className="no-print border-b border-gray-200 focus:border-gray-400 outline-none text-gray-900 text-sm" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                <span className="print-only">{fmtDate(invoiceDate)}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-gray-500">Due:</span>
                <input type="date" className="no-print border-b border-gray-200 focus:border-gray-400 outline-none text-gray-900 text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                <span className="print-only">{fmtDate(dueDate)}</span>
              </div>
            </div>
          </div>

          {/* From / Bill To */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
              <p className="text-sm font-medium text-gray-900">Your Company</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              <div className="no-print">
                <InvoiceSelect
                  options={clientOptions as any}
                  value={clientId}
                  onChange={setClientId}
                  placeholder="Select client…"
                />
              </div>
              {client ? (
                <div className="text-sm text-gray-700 mt-2 space-y-0.5">
                  <p className="font-medium">{client.name}</p>
                  {(client as any).email   && <p className="text-gray-500">{(client as any).email}</p>}
                  {(client as any).address && <p className="text-gray-500">{(client as any).address}</p>}
                </div>
              ) : (
                <p className="print-only text-sm text-gray-400 italic mt-1">—</p>
              )}
            </div>
          </div>

          {/* Project + period */}
          {(project || (startDate && endDate)) && (
            <div className="text-sm text-gray-600 border-t border-gray-100 pt-4">
              {project && <><span className="font-medium text-gray-900">Project: </span>{project.name}</>}
              {startDate && endDate && (
                <span className="ml-2 text-gray-400">· {fmtDate(startDate)} – {fmtDate(endDate)}</span>
              )}
              {project?.hourly_rate && (
                <span className="ml-2 text-gray-400">· ${project.hourly_rate}/hr</span>
              )}
            </div>
          )}

          {/* Empty state prompt */}
          {lines.length === 0 && (
            <div className="no-print py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Select a project and click <strong>Load entries</strong> to populate the invoice automatically.</p>
            </div>
          )}

          {/* Line items */}
          {lines.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/2">Description</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Hours</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Rate</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Amount</th>
                  <th className="no-print w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <input className="no-print w-full bg-transparent border-b border-gray-100 focus:border-gray-300 outline-none" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description" />
                      <span className="print-only">{line.description}</span>
                    </td>
                    <td className="py-2 text-right">
                      <input className="no-print w-16 text-right bg-transparent border-b border-gray-100 focus:border-gray-300 outline-none" type="number" min="0" step="0.01" value={line.hours} onChange={e => updateLine(i, 'hours', e.target.value)} />
                      <span className="print-only">{line.hours}</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="mr-0.5">$</span>
                      <input className="no-print w-16 text-right bg-transparent border-b border-gray-100 focus:border-gray-300 outline-none" type="number" min="0" step="0.01" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)} />
                      <span className="print-only">{line.rate.toFixed(2)}</span>
                    </td>
                    <td className="py-2 text-right font-medium">${(line.hours * line.rate).toFixed(2)}</td>
                    <td className="no-print py-2 pl-2">
                      <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button onClick={addLine} className="no-print flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add line
          </button>

          {/* Totals */}
          {lines.length > 0 && (
            <div className="flex justify-end">
              <div className="w-56 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-gray-200 pt-2">
                  <span className="font-bold text-gray-900">Total Due</span>
                  <span className="font-bold text-gray-900 text-lg">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
            <textarea
              className="no-print w-full text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-gray-400 resize-none"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, thank you message…"
            />
            {notes && <p className="print-only text-sm text-gray-600 whitespace-pre-line">{notes}</p>}
          </div>

        </div>
      </div>
    </>
  )
}
