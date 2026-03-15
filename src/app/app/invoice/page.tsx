'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useDataStore } from '@/stores'
import type { TimeEntry, Project, Client } from '@/types'

function fmtDate(dt: string | Date) {
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
function fmtDur(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

interface InvoiceLine {
  description: string
  hours: number
  rate: number
}

export default function InvoicePage() {
  const router = useRouter()
  const params = useSearchParams()
  const { projects, fetchProjects, showToast } = useDataStore()

  const projectId = params.get('project_id')
  const startDate = params.get('start') ?? ''
  const endDate   = params.get('end') ?? ''

  const [clients, setClients] = useState<Client[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [clientId, setClientId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10)
  })
  const [notes, setNotes] = useState('')

  const project = projects.find(p => p.id === projectId)
  const client  = clients.find(c => c.id === clientId)

  useEffect(() => {
    if (!projects.length) fetchProjects()
    api.get<Client[]>('/clients').then(setClients).catch(() => {})
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!projectId) return
    const q = new URLSearchParams()
    if (startDate) q.set('start_date', startDate)
    if (endDate)   q.set('end_date', endDate)
    q.set('limit', '500')
    api.get<any>(`/time-entries?project_ids=${projectId}&${q}`)
      .then(r => {
        const arr: TimeEntry[] = Array.isArray(r) ? r : (r?.entries ?? [])
        setEntries(arr)
        // Auto-build lines grouped by description
        const map: Record<string, { secs: number; rate: number }> = {}
        arr.forEach(e => {
          const key = e.description || 'Work'
          if (!map[key]) {
            const rate = e.hourly_rate ?? project?.hourly_rate ?? 0
            map[key] = { secs: 0, rate: Number(rate) }
          }
          map[key].secs += e.duration ?? 0
        })
        setLines(Object.entries(map).map(([desc, { secs, rate }]) => ({
          description: desc,
          hours: Math.round((secs / 3600) * 100) / 100,
          rate,
        })))
      })
      .catch(() => showToast({ type: 'error', title: 'Failed to load entries' }))
  }, [projectId, startDate, endDate]) // eslint-disable-line

  const subtotal = lines.reduce((s, l) => s + l.hours * l.rate, 0)
  const tax = 0  // optional future: add tax rate input

  const addLine = () => setLines(prev => [...prev, { description: '', hours: 0, rate: project?.hourly_rate ? Number(project.hourly_rate) : 0 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof InvoiceLine, val: string) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: field === 'description' ? val : Number(val) } : l))

  const handlePrint = () => window.print()

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print flex items-center gap-3 p-4 border-b border-border/30 bg-background">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground flex-1">Invoice Builder</span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="print-page max-w-3xl mx-auto bg-white text-gray-900 rounded-2xl shadow-xl p-10 space-y-8">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <input
                className="no-print mt-1 text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:border-gray-400 outline-none"
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

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
              <p className="text-sm font-medium text-gray-900">Your Company</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              <select
                className="no-print w-full text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-900 focus:outline-none focus:border-gray-400"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
              >
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {client && (
                <div className="text-sm text-gray-700 mt-1 space-y-0.5">
                  <p className="font-medium">{client.name}</p>
                  {client.email && <p className="text-gray-500">{client.email}</p>}
                  {client.address && <p className="text-gray-500">{client.address}</p>}
                </div>
              )}
              {!client && <p className="print-only text-sm text-gray-400 italic">—</p>}
            </div>
          </div>

          {/* Project info */}
          {project && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Project: </span>{project.name}
              {startDate && endDate && <span className="ml-2 text-gray-400">· {fmtDate(startDate)} – {fmtDate(endDate)}</span>}
            </div>
          )}

          {/* Line items */}
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

          <button onClick={addLine} className="no-print flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add line
          </button>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-200 pt-2">
                <span className="font-bold text-gray-900">Total Due</span>
                <span className="font-bold text-gray-900 text-lg">${(subtotal + tax).toFixed(2)}</span>
              </div>
            </div>
          </div>

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
