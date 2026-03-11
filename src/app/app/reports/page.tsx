'use client'

import { useEffect, useState } from 'react'
import { BarChart2, DollarSign, Clock, TrendingUp, Calendar } from 'lucide-react'
import { useDataStore } from '@/stores'

type Period = 'day' | 'week' | 'month'

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
}

function fmtHours(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export default function ReportsPage() {
  const {
    dashboardSummary,
    isLoadingDashboard,
    dashboardPeriod,
    fetchDashboardSummary,
    setDashboardPeriod,
  } = useDataStore()

  const [period, setPeriod] = useState<Period>('week')

  useEffect(() => {
    fetchDashboardSummary(period)
  }, [period]) // eslint-disable-line

  const handlePeriod = (p: Period) => {
    setPeriod(p)
    setDashboardPeriod(p)
  }

  const totals = dashboardSummary?.totals
  const breakdown = dashboardSummary?.project_breakdown ?? []
  const daily = dashboardSummary?.daily_breakdown ?? []
  const metrics = dashboardSummary?.productivity_metrics

  const billablePct = totals ? pct(totals.billable_time, totals.total_time) : 0

  const maxDayTime = Math.max(...daily.map(d => d.total_time), 1)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header + period selector */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Time tracking analytics</p>
          </div>
          <div className="flex gap-1 p-0.5 rounded-xl bg-white/5 border border-border/40">
            {(['day', 'week', 'month'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={`text-xs px-3 py-1.5 rounded-xl transition-all font-medium ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {isLoadingDashboard ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !dashboardSummary ? (
          <div className="py-20 text-center text-sm text-muted-foreground">No data available</div>
        ) : (
          <>
            {/* ── Stat cards ───────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Total Time"
                value={fmtHours(totals?.total_time ?? 0)}
              />
              <StatCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Billable"
                value={fmtHours(totals?.billable_time ?? 0)}
                sub={`${billablePct}% of total`}
                accent
              />
              <StatCard
                icon={<Calendar className="w-4 h-4" />}
                label="Entries"
                value={String(totals?.total_entries ?? 0)}
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Active Days"
                value={String(totals?.active_days ?? 0)}
              />
            </div>

            {/* ── Daily bar chart ───────────────────────────────── */}
            {daily.length > 1 && (
              <div className="bento-card p-5 space-y-3">
                <h2 className="text-sm font-medium text-foreground">Daily Breakdown</h2>
                <div className="flex items-end gap-1.5 h-28">
                  {daily.map((d, i) => {
                    const label = new Date(d.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })
                    const h = d.total_time > 0 ? Math.max((d.total_time / maxDayTime) * 100, 6) : 0
                    const bh = d.total_time > 0 ? (d.billable_time / d.total_time) * h : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-24 flex items-end gap-0.5 rounded-t-md overflow-hidden">
                          {/* total bar */}
                          <div className="flex-1 bg-white/10 rounded-sm relative" style={{ height: `${h}%` }}>
                            {/* billable overlay */}
                            {bh > 0 && (
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-primary/50 rounded-sm"
                                style={{ height: `${(bh / h) * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-white/10 inline-block" />
                    Total
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary/50 inline-block" />
                    Billable
                  </span>
                </div>
              </div>
            )}

            {/* ── Billable ratio ────────────────────────────────── */}
            <div className="bento-card p-5 space-y-3">
              <h2 className="text-sm font-medium text-foreground">Billable vs Non-Billable</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-700"
                    style={{ width: `${billablePct}%` }}
                  />
                </div>
                <span className="text-sm font-medium tabular-nums w-10 text-right text-primary">
                  {billablePct}%
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>
                  <span className="text-primary font-medium">{fmtHours(totals?.billable_time ?? 0)}</span>
                  {' '}billable
                </span>
                <span>
                  <span className="text-foreground/60 font-medium">{fmtHours(totals?.non_billable_time ?? 0)}</span>
                  {' '}non-billable
                </span>
              </div>
            </div>

            {/* ── Project breakdown ─────────────────────────────── */}
            {breakdown.length > 0 && (
              <div className="bento-card p-5 space-y-3">
                <h2 className="text-sm font-medium text-foreground">By Project</h2>
                <div className="space-y-3">
                  {breakdown.map(item => (
                    <div key={item.project.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.project.color }}
                          />
                          <span className="text-foreground/80">{item.project.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="tabular-nums">{fmtHours(item.total_time)}</span>
                          <span className="w-8 text-right">{Math.round(item.percentage)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.project.color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Productivity metrics ──────────────────────────── */}
            {metrics && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bento-sage p-4 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-1">Avg session</p>
                  <p className="text-lg font-light text-foreground">{fmtHours(metrics.average_session_length)}</p>
                </div>
                <div className="bento-sage p-4 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-1">Peak hour</p>
                  <p className="text-lg font-light text-foreground">
                    {metrics.most_productive_hour != null
                      ? `${String(metrics.most_productive_hour).padStart(2, '0')}:00`
                      : '—'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bento-card p-4 space-y-2">
      <div className={`${accent ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</div>
      <p className="text-2xl font-light text-foreground tabular-time">{value}</p>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
