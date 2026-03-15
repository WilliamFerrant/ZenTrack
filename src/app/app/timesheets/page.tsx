'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import { useDataStore, useAuthStore } from '@/stores'

type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

interface TimesheetUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface Timesheet {
  id: number
  week_start: string
  week_end: string
  status: TimesheetStatus
  notes: string | null
  reviewer_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
  user_id: number
  user?: TimesheetUser
  reviewer?: TimesheetUser
}

const STATUS_CONFIG: Record<TimesheetStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:     { label: 'Draft',     color: 'text-muted-foreground',  icon: <Clock className="w-3.5 h-3.5" /> },
  SUBMITTED: { label: 'Submitted', color: 'text-amber-400',          icon: <Send className="w-3.5 h-3.5" /> },
  APPROVED:  { label: 'Approved',  color: 'text-emerald-400',        icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED:  { label: 'Rejected',  color: 'text-red-400',            icon: <XCircle className="w-3.5 h-3.5" /> },
}

function fmtWeek(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

export default function TimesheetsPage() {
  const { showToast } = useDataStore()
  const { user: currentUser } = useAuthStore()
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'mine' | 'team'>('mine')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitNotes, setSubmitNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'

  const load = () => {
    setLoading(true)
    const params = tab === 'team' ? '' : ''
    api.get<Timesheet[]>('/timesheets')
      .then(setTimesheets)
      .catch(() => showToast({ type: 'error', title: 'Failed to load timesheets' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab]) // eslint-disable-line

  const mySheets = timesheets.filter(t => String(t.user_id) === currentUser?.id)
  const teamSheets = timesheets.filter(t => String(t.user_id) !== currentUser?.id)
  const displayed = tab === 'mine' ? mySheets : teamSheets

  const handleSubmit = async (id: number) => {
    setSaving(true)
    try {
      const updated = await api.post<Timesheet>(`/timesheets/${id}/submit`, { notes: submitNotes || undefined })
      setTimesheets(prev => prev.map(t => t.id === id ? updated : t))
      setSubmitNotes('')
      setExpandedId(null)
      showToast({ type: 'success', title: 'Timesheet submitted' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to submit' })
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: number) => {
    setSaving(true)
    try {
      const updated = await api.post<Timesheet>(`/timesheets/${id}/approve`, { reviewer_notes: reviewNotes || undefined })
      setTimesheets(prev => prev.map(t => t.id === id ? updated : t))
      setReviewNotes('')
      setExpandedId(null)
      showToast({ type: 'success', title: 'Timesheet approved' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to approve' })
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (id: number) => {
    if (!reviewNotes.trim()) {
      showToast({ type: 'warning', title: 'Please add rejection notes' })
      return
    }
    setSaving(true)
    try {
      const updated = await api.post<Timesheet>(`/timesheets/${id}/reject`, { reviewer_notes: reviewNotes })
      setTimesheets(prev => prev.map(t => t.id === id ? updated : t))
      setReviewNotes('')
      setExpandedId(null)
      showToast({ type: 'success', title: 'Timesheet rejected' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to reject' })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCurrent = async () => {
    setSaving(true)
    try {
      const ts = await api.get<Timesheet>('/timesheets/current')
      setTimesheets(prev => {
        if (prev.find(t => t.id === ts.id)) return prev
        return [ts, ...prev]
      })
    } catch {
      showToast({ type: 'error', title: 'Failed to create timesheet' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Timesheets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Weekly approval workflow</p>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'mine' && (
              <button
                onClick={handleCreateCurrent}
                disabled={saving}
                className="text-xs px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                This week
              </button>
            )}
            {canManage && (
              <div className="flex gap-1 p-0.5 rounded-xl bg-white/5 border border-border/40">
                {(['mine', 'team'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-medium ${
                      tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'mine' ? 'Mine' : 'Team'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {tab === 'mine' ? 'No timesheets yet — click "This week" to create one.' : 'No team timesheets to review.'}
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(ts => {
              const cfg = STATUS_CONFIG[ts.status]
              const isOpen = expandedId === ts.id
              const isOwn = String(ts.user_id) === currentUser?.id
              return (
                <div key={ts.id} className="bento-card rounded-2xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : ts.id)}
                  >
                    {/* Status */}
                    <span className={`flex items-center gap-1.5 text-xs font-medium w-24 flex-shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>

                    {/* Week */}
                    <span className="flex-1 text-sm text-foreground">{fmtWeek(ts.week_start, ts.week_end)}</span>

                    {/* User (team view) */}
                    {tab === 'team' && ts.user && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {ts.user.first_name} {ts.user.last_name}
                      </span>
                    )}

                    {/* Expand chevron */}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="px-5 pb-4 space-y-3 border-t border-border/20 pt-3">
                      {ts.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground/80">{ts.notes}</p>
                        </div>
                      )}
                      {ts.reviewer_notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reviewer notes</p>
                          <p className={`text-sm ${ts.status === 'REJECTED' ? 'text-red-400' : 'text-emerald-400'}`}>{ts.reviewer_notes}</p>
                        </div>
                      )}

                      {/* Submit action (own draft or rejected) */}
                      {isOwn && (ts.status === 'DRAFT' || ts.status === 'REJECTED') && (
                        <div className="space-y-2">
                          <textarea
                            className="w-full text-sm bg-white/[0.04] border border-border/40 rounded-xl p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
                            rows={2}
                            placeholder="Optional notes for reviewer…"
                            value={submitNotes}
                            onChange={e => setSubmitNotes(e.target.value)}
                          />
                          <button
                            onClick={() => handleSubmit(ts.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Submit for review
                          </button>
                        </div>
                      )}

                      {/* Review actions (manager/admin, submitted) */}
                      {canManage && ts.status === 'SUBMITTED' && (
                        <div className="space-y-2">
                          <textarea
                            className="w-full text-sm bg-white/[0.04] border border-border/40 rounded-xl p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
                            rows={2}
                            placeholder="Reviewer notes (required to reject)…"
                            value={reviewNotes}
                            onChange={e => setReviewNotes(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(ts.id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-emerald-500/80 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(ts.id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
