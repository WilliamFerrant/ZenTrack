'use client'

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react'
import { ChevronLeft, ChevronRight, DollarSign, Trash2, X } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { TimeEntry, Project } from '@/types'
import { api } from '@/lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 56     // px per hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIME_COL_WIDTH = 52  // px — left label column
const MIN_DRAG_MINUTES = 5
const DRAG_THRESHOLD_PX = 5  // pixels of movement before we consider it a drag

// ─── Date utilities ───────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEnd(date: Date): Date {
  const s = getWeekStart(date)
  const e = new Date(s)
  e.setDate(s.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yr = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yr.getTime()) / 86400000 + 1) / 7)
}

function getDaysOfWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDuration(secs: number): string {
  if (!secs || secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(dt: string | Date): string {
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Extract HH:MM from a local Date (for drag-created entries where we construct local dates)
function toTimeValLocal(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Extract HH:MM and YYYY-MM-DD from an ISO string without timezone conversion
function isoToLocalParts(iso: string | Date): { date: string; time: string } {
  // Backend returns naive datetimes — treat as local by appending Z if missing
  const raw = String(iso)
  const withZ = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z'
  const d = new Date(withZ)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

// Snap minutes to 5-minute increments
function snapMinutes(totalMinutes: number): number {
  return Math.round(totalMinutes / 5) * 5
}

// Convert a pixel offset within the grid column to minutes from midnight
function pxToMinutes(px: number): number {
  return snapMinutes((px / HOUR_HEIGHT) * 60)
}

// Convert minutes-from-midnight to a CSS top offset in px
function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT
}

// Build a local ISO string (no UTC conversion) — used for all datetime payloads
function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
         `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DragState {
  colIndex: number          // 0–6 (Mon–Sun)
  startMinutes: number      // minutes from midnight
  currentMinutes: number    // minutes from midnight (drag end)
}

interface PopupState {
  mode: 'create' | 'edit'
  entry?: TimeEntry         // present when mode === 'edit'
  // pre-filled times
  dayDate: Date
  startMinutes: number
  endMinutes: number
  // screen coords for positioning
  anchorX: number
  anchorY: number
}

interface EntryFormState {
  description: string
  project_id: string
  date: string
  start_time: string
  end_time: string
  is_billable: boolean
}

// State for move / resize interactions on existing entry blocks
interface InteractState {
  type: 'move' | 'resize-top' | 'resize-bottom'
  entryId: string
  colIndex: number
  // original entry times in minutes from midnight
  origStartMin: number
  origEndMin: number
  // where mouse started (minutes from midnight)
  mouseStartMin: number
  // live preview positions (minutes from midnight)
  startMin: number
  endMin: number
  // mouse screen position when interaction started (for px threshold)
  mouseStartClientY: number
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

// Given an entry and a day, return the CSS top+height in px for that day's column.
// Handles entries that START on a different day (clip to 0) and END on a different
// day (clip to 24*60). Returns null if the entry has no overlap with this day.
function entryGeometry(
  entry: TimeEntry,
  day: Date,
): { top: number; height: number } | null {
  const start = new Date(entry.start_time)
  const end   = new Date(entry.end_time)

  // Day bounds in ms
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)

  if (end <= dayStart || start > dayEnd) return null

  const clampedStart = start < dayStart ? dayStart : start
  const clampedEnd   = end   > dayEnd   ? dayEnd   : end

  const startMins = clampedStart.getHours() * 60 + clampedStart.getMinutes()
  const endMins   = clampedEnd.getHours()   * 60 + clampedEnd.getMinutes()
  const durationMins = Math.max(endMins - startMins, 15) // min visual height

  return {
    top:    minutesToPx(startMins),
    height: minutesToPx(durationMins),
  }
}

// Simple column-overlap layout: returns a list of { entry, left%, width%, geo }
interface LayoutBlock {
  entry: TimeEntry
  geo: { top: number; height: number }
  left: number   // 0..1 fraction
  width: number  // 0..1 fraction
}

function layoutDayEntries(entries: TimeEntry[], day: Date): LayoutBlock[] {
  // Build geo for each entry
  const blocks: LayoutBlock[] = []
  for (const e of entries) {
    const geo = entryGeometry(e, day)
    if (!geo) continue
    blocks.push({ entry: e, geo, left: 0, width: 1 })
  }

  // Sort by start time
  blocks.sort((a, b) => a.geo.top - b.geo.top)

  // Greedy column assignment for overlap
  const columns: number[] = [] // tracks the bottom edge (top+height) of each column

  const blockCols: number[] = new Array(blocks.length).fill(0)

  for (let i = 0; i < blocks.length; i++) {
    const { top, height } = blocks[i].geo
    let placed = false
    for (let col = 0; col < columns.length; col++) {
      if (columns[col] <= top) {
        blockCols[i] = col
        columns[col] = top + height
        placed = true
        break
      }
    }
    if (!placed) {
      blockCols[i] = columns.length
      columns.push(top + height)
    }
  }

  const numCols = columns.length || 1

  // Second pass: widen blocks to fill available space
  for (let i = 0; i < blocks.length; i++) {
    const col = blockCols[i]
    // Find how many cols are "active" during this block's time range
    // Simple approach: use total numCols
    blocks[i].left  = col / numCols
    blocks[i].width = 1 / numCols
  }

  return blocks
}

// ─── EntryBlock ───────────────────────────────────────────────────────────────

function EntryBlock({
  block,
  project,
  onMoveStart,
  onResizeStart,
  isDragging,
}: {
  block: LayoutBlock
  project: Project | undefined
  onMoveStart: (e: React.MouseEvent, entry: TimeEntry) => void
  onResizeStart: (e: React.MouseEvent, entry: TimeEntry, edge: 'top' | 'bottom') => void
  isDragging: boolean
}) {
  const { entry, geo, left, width } = block
  const color = project?.color ?? 'hsl(var(--primary))'
  const durSecs = entry.duration && entry.duration > 0
    ? entry.duration
    : Math.round((new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000)

  const showDescription = geo.height >= 28
  const showTime        = geo.height >= 44

  return (
    <div
      onMouseDown={e => {
        e.stopPropagation()
        onMoveStart(e, entry)
      }}
      style={{
        position: 'absolute',
        top:    geo.top + 1,
        height: Math.max(geo.height - 2, 14),
        left:   `calc(${left * 100}% + 2px)`,
        width:  `calc(${width * 100}% - 4px)`,
        backgroundColor: color + 'cc',  // ~80% opacity
        border: `1px solid ${color}`,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: 2,
        opacity: isDragging ? 0.4 : 1,
        transition: isDragging ? 'none' : 'opacity 0.1s',
      }}
    >
      {/* Top resize handle */}
      <div
        onMouseDown={e => {
          e.stopPropagation()
          onResizeStart(e, entry, 'top')
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          cursor: 'ns-resize',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: 16,
          height: 2,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.4)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Block body content */}
      <div style={{ padding: '8px 5px 4px 5px', lineHeight: 1.3 }}>
        {showDescription && (
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {entry.description || <em style={{ opacity: 0.7 }}>No description</em>}
          </div>
        )}
        {showTime && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
            {fmtTime(entry.start_time)}–{fmtTime(entry.end_time)}
            {' · '}
            {fmtDuration(durSecs)}
          </div>
        )}
      </div>

      {/* Bottom resize handle */}
      <div
        onMouseDown={e => {
          e.stopPropagation()
          onResizeStart(e, entry, 'bottom')
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          cursor: 'ns-resize',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: 16,
          height: 2,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.4)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}

// ─── InteractGhostBlock ───────────────────────────────────────────────────────

function InteractGhostBlock({
  startMin,
  endMin,
  color,
}: {
  startMin: number
  endMin: number
  color: string
}) {
  const top    = minutesToPx(startMin)
  const height = Math.max(minutesToPx(endMin - startMin), minutesToPx(MIN_DRAG_MINUTES))

  return (
    <div
      style={{
        position: 'absolute',
        top:    top + 1,
        height: height - 2,
        left:   2,
        right:  2,
        backgroundColor: color + '66',  // ~40% opacity
        border: `2px solid ${color}`,
        borderRadius: 6,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ padding: '2px 5px', fontSize: 10, color: '#fff', fontWeight: 600 }}>
        {fmtDuration((endMin - startMin) * 60)}
      </div>
    </div>
  )
}

// ─── DragPreviewBlock ─────────────────────────────────────────────────────────

function DragPreviewBlock({ drag }: { drag: DragState }) {
  const startMin = Math.min(drag.startMinutes, drag.currentMinutes)
  const endMin   = Math.max(drag.startMinutes, drag.currentMinutes)
  const top      = minutesToPx(startMin)
  const height   = Math.max(minutesToPx(endMin - startMin), minutesToPx(MIN_DRAG_MINUTES))

  return (
    <div
      style={{
        position: 'absolute',
        top:    top + 1,
        height: height - 2,
        left:   2,
        right:  2,
        backgroundColor: 'hsl(var(--primary) / 0.25)',
        border: '2px solid hsl(var(--primary))',
        borderRadius: 6,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ padding: '2px 5px', fontSize: 10, color: 'hsl(var(--primary))', fontWeight: 600 }}>
        {fmtDuration((endMin - startMin) * 60)}
      </div>
    </div>
  )
}

// ─── CurrentTimeLine ──────────────────────────────────────────────────────────

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const mins = now.getHours() * 60 + now.getMinutes()
  const top = minutesToPx(mins)
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: 'hsl(var(--primary))',
        flexShrink: 0,
        marginLeft: -4,
      }} />
      <div style={{
        flex: 1,
        height: 2,
        backgroundColor: 'hsl(var(--primary))',
      }} />
    </div>
  )
}

// ─── EntryPopup ───────────────────────────────────────────────────────────────

function EntryPopup({
  popup,
  projects,
  onClose,
  onSaved,
}: {
  popup: PopupState
  projects: Project[]
  onClose: () => void
  onSaved: () => void
}) {
  const { createTimeEntry, updateTimeEntry, deleteTimeEntry } = useDataStore()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<EntryFormState>(() => {
    const e = popup.entry
    if (e) {
      // Parse as local (same as entryGeometry) — no Z append to avoid UTC shift
      const sd = new Date(e.start_time)
      const ed = new Date(e.end_time)
      const pad = (n: number) => String(n).padStart(2, '0')
      const date = `${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}`
      const startTime = `${pad(sd.getHours())}:${pad(sd.getMinutes())}`
      const endTime   = `${pad(ed.getHours())}:${pad(ed.getMinutes())}`
      return {
        description: e.description ?? '',
        project_id:  e.project_id  ?? '',
        date,
        start_time:  startTime,
        end_time:    endTime,
        is_billable: e.is_billable,
      }
    }
    return {
      description: '',
      project_id:  '',
      date:        toDateKey(popup.dayDate),
      start_time:  toTimeValLocal(
        new Date(popup.dayDate.getFullYear(), popup.dayDate.getMonth(), popup.dayDate.getDate(),
          Math.floor(popup.startMinutes / 60), popup.startMinutes % 60)
      ),
      end_time: toTimeValLocal(
        new Date(popup.dayDate.getFullYear(), popup.dayDate.getMonth(), popup.dayDate.getDate(),
          Math.floor(popup.endMinutes / 60), popup.endMinutes % 60)
      ),
      is_billable: false,
    }
  })

  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const descRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    descRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) onClose()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  function upd(field: keyof EntryFormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Build an ISO string that the backend (which stores naive datetimes) will
  // interpret as the local wall-clock time the user selected.
  // new Date("YYYY-MM-DDTHH:MM") is parsed as LOCAL time → toISOString() gives UTC.
  // The backend strips the Z and stores the UTC value as if it were local, so we
  // must send the local time as-is without any UTC offset conversion.
  // Solution: format the local datetime directly as a string without using toISOString().
  function toLocalISOStringLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
           `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  }

  function buildPayload() {
    const [sy, sm, sd] = form.date.split('-').map(Number)
    const [sh, smin]   = form.start_time.split(':').map(Number)
    const [eh, emin]   = form.end_time.split(':').map(Number)
    const startDt = new Date(sy, sm - 1, sd, sh, smin, 0)
    let   endDt   = new Date(sy, sm - 1, sd, eh, emin, 0)
    if (endDt <= startDt) endDt = new Date(endDt.getTime() + 86400000)
    return {
      description: form.description || undefined,
      project_id:  form.project_id  || undefined,
      start_time:  toLocalISOStringLocal(startDt),
      end_time:    toLocalISOStringLocal(endDt),
      is_billable: form.is_billable,
    }
  }

  const startDt = new Date(`${form.date}T${form.start_time}`)
  let   endDt   = new Date(`${form.date}T${form.end_time}`)
  if (endDt <= startDt) endDt = new Date(endDt.getTime() + 86400000)
  const previewSecs = endDt > startDt ? Math.round((endDt.getTime() - startDt.getTime()) / 1000) : 0

  async function handleSave() {
    if (previewSecs <= 0 || saving) return
    setSaving(true)
    try {
      if (popup.mode === 'edit' && popup.entry) {
        await updateTimeEntry(popup.entry.id, buildPayload())
      } else {
        await createTimeEntry(buildPayload())
      }
      onSaved() // closes popup + reloads
    } catch {
      setSaving(false) // only reset on error; on success popup unmounts
    }
  }

  async function handleDelete() {
    if (!popup.entry) return
    setDeleting(true)
    try {
      await deleteTimeEntry(popup.entry.id)
      onSaved()
    } catch {
      // errors shown by store
    } finally {
      setDeleting(false)
    }
  }

  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const MARGIN = 16
    const GAP = 8
    const W = card.offsetWidth
    const H = card.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const ax = popup.anchorX  // right edge of column
    const ay = popup.anchorY  // vertical midpoint of block

    // Horizontally: prefer right of column, else left
    let left = ax + GAP
    if (left + W > vw - MARGIN) left = ax - W - GAP
    left = Math.max(MARGIN, Math.min(left, vw - W - MARGIN))

    // Vertically: center on the block midpoint
    let top = ay - H / 2
    top = Math.max(MARGIN, Math.min(top, vh - H - MARGIN))

    setPos({ left, top })
  }, [popup.anchorX, popup.anchorY])

  return (
    /* full-viewport invisible overlay to capture outside clicks */
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'all',
      }}
    >
      {/* Floating card */}
      <div
        ref={cardRef}
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: pos?.left ?? -9999,
          top:  pos?.top  ?? -9999,
          width: 360,
          visibility: pos ? 'visible' : 'hidden',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {popup.mode === 'edit' ? 'Edit entry' : 'New entry'}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: 4,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        <input
          ref={descRef}
          value={form.description}
          onChange={e => upd('description', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="What did you work on?"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid hsl(var(--border))',
            outline: 'none',
            fontSize: 13,
            color: 'hsl(var(--foreground))',
            paddingBottom: 6,
          }}
        />

        {/* Project */}
        <select
          value={form.project_id}
          onChange={e => upd('project_id', e.target.value)}
          style={{
            background: 'hsl(var(--background) / 0.6)',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: 'hsl(var(--foreground))',
            outline: 'none',
            width: '100%',
          }}
        >
          <option value="">No project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Date + time row */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={form.date}
            onChange={e => upd('date', e.target.value)}
            style={inputStyle}
          />
          <input
            type="time"
            value={form.start_time}
            onChange={e => upd('start_time', e.target.value)}
            style={{ ...inputStyle, width: 96 }}
          />
          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>–</span>
          <input
            type="time"
            value={form.end_time}
            onChange={e => upd('end_time', e.target.value)}
            style={{ ...inputStyle, width: 96 }}
          />
          {previewSecs > 0 && (
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
              {fmtDuration(previewSecs)}
            </span>
          )}
        </div>

        {/* Billable toggle */}
        <button
          type="button"
          onClick={() => upd('is_billable', !form.is_billable)}
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 8,
            border: form.is_billable
              ? '1px solid hsl(var(--primary) / 0.5)'
              : '1px solid hsl(var(--border))',
            background: form.is_billable ? 'hsl(var(--primary) / 0.12)' : 'transparent',
            color: form.is_billable ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            cursor: 'pointer',
          }}
        >
          <DollarSign size={12} />
          Billable
        </button>

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {popup.mode === 'edit' ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: '#f87171',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={12} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                fontSize: 12,
                color: 'hsl(var(--muted-foreground))',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 8,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || previewSecs <= 0}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'hsl(var(--primary-foreground))',
                background: 'hsl(var(--primary))',
                border: 'none',
                cursor: saving || previewSecs <= 0 ? 'not-allowed' : 'pointer',
                padding: '6px 16px',
                borderRadius: 8,
                opacity: saving || previewSecs <= 0 ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'hsl(var(--background) / 0.6)',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  padding: '5px 8px',
  fontSize: 12,
  color: 'hsl(var(--foreground))',
  outline: 'none',
}

// ─── WeekCalendar (main export) ───────────────────────────────────────────────

export default function WeekCalendar() {
  const [weekRef, setWeekRef]     = useState(new Date())
  const weekStart = useMemo(() => getWeekStart(weekRef), [weekRef])
  const weekEnd   = useMemo(() => getWeekEnd(weekRef),   [weekRef])
  const days      = useMemo(() => getDaysOfWeek(weekStart), [weekStart])
  const weekNum   = useMemo(() => getISOWeek(weekStart), [weekStart])

  const [entries, setEntries]     = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [drag, setDrag]           = useState<DragState | null>(null)
  const [frozenDrag, setFrozenDrag] = useState<DragState | null>(null) // kept while popup open
  const [popup, setPopup]         = useState<PopupState | null>(null)

  // Interact drag state (move / resize existing entries)
  const [interactDrag, setInteractDrag] = useState<InteractState | null>(null)
  // Ref copy so window listeners always read the latest without re-subscribing
  const interactDragRef = useRef<InteractState | null>(null)
  interactDragRef.current = interactDrag

  const gridRef = useRef<HTMLDivElement>(null)

  const { projects, fetchProjects, updateTimeEntry } = useDataStore()

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadWeekEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const s = toDateKey(weekStart)
      const e = toDateKey(weekEnd)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp = await api.get<any>(`/time-entries?start_date=${s}&end_date=${e}&limit=500`)
      setEntries(Array.isArray(resp) ? resp : (resp?.entries ?? []))
    } catch {
      setEntries([])
    }
    setIsLoading(false)
  }, [weekStart, weekEnd])

  useEffect(() => { loadWeekEntries() }, [loadWeekEntries])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!projects.length) fetchProjects() }, [])

  // ─── Scroll to current time (or 8 AM) on mount ────────────────────────────

  useEffect(() => {
    if (!gridRef.current) return
    const scrollContainer = gridRef.current.closest('[style*="overflow"]') as HTMLElement
      ?? gridRef.current.parentElement
    if (!scrollContainer) return
    const now = new Date()
    const isCurrentWeek = sameDay(getWeekStart(now), weekStart)
    const mins = isCurrentWeek
      ? Math.max(0, now.getHours() * 60 + now.getMinutes() - 90)
      : 8 * 60
    scrollContainer.scrollTop = minutesToPx(mins)
  }, [weekStart])

  // ─── Derived per-day entries ───────────────────────────────────────────────

  const entriesByDay = useMemo(() => {
    const map: Record<string, TimeEntry[]> = {}
    days.forEach(d => { map[toDateKey(d)] = [] })
    entries.forEach(entry => {
      const start = new Date(entry.start_time)
      const end   = new Date(entry.end_time)
      // Assign to every day the entry overlaps
      days.forEach(d => {
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
        const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999)
        if (start <= dayEnd && end > dayStart) {
          map[toDateKey(d)].push(entry)
        }
      })
    })
    return map
  }, [entries, days])

  // ─── Today & week stats ────────────────────────────────────────────────────

  const today          = useMemo(() => new Date(), [])
  const isCurrentWeek  = sameDay(getWeekStart(today), weekStart)

  const weekSeconds = useMemo(() =>
    entries.reduce((acc, e) => acc + (e.duration || 0), 0),
    [entries]
  )

  // ─── Creation drag handlers ─────────────────────────────────────────────────

  // Convert a MouseEvent clientY to minutes-from-midnight for a given column element
  function clientYToMinutes(clientY: number, colEl: Element): number {
    const rect = colEl.getBoundingClientRect()
    const pxOffset = clientY - rect.top
    return Math.max(0, Math.min(pxToMinutes(pxOffset), 23 * 60 + 45))
  }

  function handleColumnMouseDown(e: React.MouseEvent<HTMLDivElement>, colIndex: number) {
    // Only left-button drag on empty area (blocks use stopPropagation)
    if (e.button !== 0) return
    if (popup) return // don't start drag when popup open

    const mins = clientYToMinutes(e.clientY, e.currentTarget)
    setDrag({ colIndex, startMinutes: mins, currentMinutes: mins })

    e.preventDefault()
  }

  useEffect(() => {
    if (!drag) return

    function onMouseMove(e: MouseEvent) {
      if (!drag) return
      // Find the column element by colIndex
      const cols = gridRef.current?.querySelectorAll('[data-col-index]')
      const colEl = cols?.[drag.colIndex]
      if (!colEl) return
      const mins = clientYToMinutes(e.clientY, colEl)
      setDrag(prev => prev ? { ...prev, currentMinutes: mins } : null)
    }

    function onMouseUp(e: MouseEvent) {
      if (!drag) return
      const cols = gridRef.current?.querySelectorAll('[data-col-index]')
      const colEl = cols?.[drag.colIndex]
      const endMins = colEl ? clientYToMinutes(e.clientY, colEl) : drag.currentMinutes

      const startMin = Math.min(drag.startMinutes, endMins)
      const endMin   = Math.max(drag.startMinutes, endMins)

      // Only open popup if dragged at least MIN_DRAG_MINUTES
      if (endMin - startMin >= MIN_DRAG_MINUTES) {
        const finalDrag: DragState = { ...drag, startMinutes: startMin, currentMinutes: endMin }

        // Anchor popup to the right edge of the dragged column, vertically centered on the block
        let anchorX = e.clientX
        let anchorY = e.clientY
        if (colEl) {
          const colRect = colEl.getBoundingClientRect()
          const blockMidY = colRect.top + minutesToPx((startMin + endMin) / 2)
          anchorX = colRect.right
          anchorY = blockMidY
        }

        setFrozenDrag(finalDrag)
        setPopup({
          mode: 'create',
          dayDate: days[drag.colIndex],
          startMinutes: startMin,
          endMinutes: endMin,
          anchorX,
          anchorY,
        })
      }
      setDrag(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, days])

  // ─── Interact drag handlers (move / resize existing entries) ───────────────

  // Convert raw clientY to minutes from midnight using the column at interactDrag.colIndex
  function clientYToMinutesForCol(clientY: number, colIndex: number): number {
    const cols = gridRef.current?.querySelectorAll('[data-col-index]')
    const colEl = cols?.[colIndex]
    if (!colEl) return 0
    return clientYToMinutes(clientY, colEl)
  }

  function handleMoveStart(e: React.MouseEvent, entry: TimeEntry, colIndex: number) {
    if (e.button !== 0) return
    if (popup || drag) return // don't start when popup or creation drag active

    const startDate = new Date(entry.start_time)
    const endDate   = new Date(entry.end_time)
    const origStartMin = startDate.getHours() * 60 + startDate.getMinutes()
    const origEndMin   = endDate.getHours()   * 60 + endDate.getMinutes()

    const mouseStartMin = clientYToMinutesForCol(e.clientY, colIndex)

    setInteractDrag({
      type: 'move',
      entryId: entry.id,
      colIndex,
      origStartMin,
      origEndMin,
      mouseStartMin,
      startMin: origStartMin,
      endMin: origEndMin,
      mouseStartClientY: e.clientY,
    })

    e.preventDefault()
  }

  function handleResizeStart(e: React.MouseEvent, entry: TimeEntry, colIndex: number, edge: 'top' | 'bottom') {
    if (e.button !== 0) return
    if (popup || drag) return

    const startDate = new Date(entry.start_time)
    const endDate   = new Date(entry.end_time)
    const origStartMin = startDate.getHours() * 60 + startDate.getMinutes()
    const origEndMin   = endDate.getHours()   * 60 + endDate.getMinutes()

    const mouseStartMin = clientYToMinutesForCol(e.clientY, colIndex)

    setInteractDrag({
      type: edge === 'top' ? 'resize-top' : 'resize-bottom',
      entryId: entry.id,
      colIndex,
      origStartMin,
      origEndMin,
      mouseStartMin,
      // ghost starts at original positions — onMouseMove applies delta from mouseStartMin
      startMin: origStartMin,
      endMin:   origEndMin,
      mouseStartClientY: e.clientY,
    })

    e.preventDefault()
  }

  useEffect(() => {
    if (!interactDrag) return

    function onMouseMove(e: MouseEvent) {
      const id = interactDragRef.current
      if (!id) return

      // Use raw pixel delta to avoid any clientYToMinutes conversion issues
      const pxDelta = e.clientY - id.mouseStartClientY
      const minDelta = snapMinutes(pxDelta / HOUR_HEIGHT * 60)
      const duration = id.origEndMin - id.origStartMin

      let newStart = id.startMin
      let newEnd   = id.endMin

      if (id.type === 'move') {
        newStart = snapMinutes(Math.max(0, Math.min(id.origStartMin + minDelta, 23 * 60 + 55 - duration)))
        newEnd   = newStart + duration
      } else if (id.type === 'resize-top') {
        newStart = snapMinutes(Math.max(0, id.origStartMin + minDelta))
        if (newStart >= id.origEndMin - MIN_DRAG_MINUTES) newStart = id.origEndMin - MIN_DRAG_MINUTES
        newEnd = id.origEndMin
      } else if (id.type === 'resize-bottom') {
        newEnd = snapMinutes(id.origEndMin + minDelta)
        newEnd = Math.max(id.origStartMin + MIN_DRAG_MINUTES, Math.min(newEnd, 24 * 60))
        newStart = id.origStartMin
      }

      setInteractDrag(prev => prev ? { ...prev, startMin: newStart, endMin: newEnd } : null)
    }

    async function onMouseUp(e: MouseEvent) {
      const id = interactDragRef.current
      if (!id) return

      const movedPx = Math.abs(e.clientY - id.mouseStartClientY)

      if (movedPx < DRAG_THRESHOLD_PX && id.type === 'move') {
        // Treat as a click — open edit popup
        const entry = entries.find(en => en.id === id.entryId)
        if (entry) {
          const cols = gridRef.current?.querySelectorAll('[data-col-index]')
          const colEl = cols?.[id.colIndex]
          let anchorX = e.clientX
          let anchorY = e.clientY
          if (colEl) {
            const colRect = colEl.getBoundingClientRect()
            anchorX = colRect.right
            anchorY = colRect.top + minutesToPx((id.origStartMin + id.origEndMin) / 2)
          }
          const startDate = new Date(entry.start_time)
          setPopup({
            mode: 'edit',
            entry,
            dayDate: startDate,
            startMinutes: id.origStartMin,
            endMinutes: id.origEndMin,
            anchorX,
            anchorY,
          })
        }
      } else {
        // Commit the new times via updateTimeEntry
        const entry = entries.find(en => en.id === id.entryId)
        if (entry) {
          // Reconstruct date from the original entry (parse as local, same as entryGeometry)
          const origDt = new Date(entry.start_time)
          const oy = origDt.getFullYear(), om = origDt.getMonth() + 1, od = origDt.getDate()

          const newStartDt = new Date(oy, om - 1, od, Math.floor(id.startMin / 60), id.startMin % 60, 0)
          let   newEndDt   = new Date(oy, om - 1, od, Math.floor(id.endMin   / 60), id.endMin   % 60, 0)
          // Handle crossing midnight
          if (newEndDt <= newStartDt) newEndDt = new Date(newEndDt.getTime() + 86400000)

          try {
            await updateTimeEntry(id.entryId, {
              start_time: toLocalISOString(newStartDt),
              end_time:   toLocalISOString(newEndDt),
            }, true)
            await loadWeekEntries()
          } catch {
            // errors shown by store
          }
        }
      }

      setInteractDrag(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactDrag !== null, entries])

  // ─── Navigation ───────────────────────────────────────────────────────────

  function prevWeek() {
    setWeekRef(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  }
  function nextWeek() {
    setWeekRef(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  }
  function goToday() { setWeekRef(new Date()) }

  // ─── Render ────────────────────────────────────────────────────────────────

  const totalGridHeight = HOUR_HEIGHT * 24

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 0 }}>

      {/* ── Top navigation bar ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 4px 10px 4px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={prevWeek} style={navBtnStyle}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextWeek} style={navBtnStyle}>
            <ChevronRight size={16} />
          </button>
          {!isCurrentWeek && (
            <button onClick={goToday} style={todayBtnStyle}>Today</button>
          )}
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span style={{ marginLeft: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
            W{weekNum}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLoading && (
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Loading…</span>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {fmtDuration(weekSeconds)}
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>this week</span>
        </div>
      </div>

      {/* ── Day header row ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)`,
        borderBottom: '1px solid hsl(0 0% 100% / 0.06)',
        flexShrink: 0,
      }}>
        {/* time label spacer */}
        <div />
        {days.map((day, i) => {
          const isToday = sameDay(day, today)
          return (
            <div key={i} style={{
              padding: '6px 0',
              textAlign: 'center',
              borderLeft: '1px solid hsl(0 0% 100% / 0.06)',
              background: isToday ? 'hsl(var(--primary) / 0.06)' : 'transparent',
            }}>
              <div style={{
                fontSize: 11,
                color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {DAY_LABELS[i]}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                lineHeight: 1.2,
              }}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Hour grid ──────────────────────────────────────────────────────── */}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)`,
          position: 'relative',
          minHeight: 0,
        }}
      >
        {/* Left hour labels */}
        <div style={{ position: 'relative', height: totalGridHeight }}>
          {HOURS.map(h => (
            <div
              key={h}
              style={{
                position: 'absolute',
                top: h * HOUR_HEIGHT,
                right: 8,
                height: HOUR_HEIGHT,
                display: 'flex',
                alignItems: 'flex-start',
                paddingTop: 3,
              }}
            >
              <span style={{
                fontSize: 10,
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1,
                userSelect: 'none',
              }}>
                {h === 0 ? '12 AM'
                  : h < 12 ? `${h} AM`
                  : h === 12 ? '12 PM'
                  : `${h - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {days.map((day, colIndex) => {
          const key     = toDateKey(day)
          const isToday = sameDay(day, today)
          const dayEntries = entriesByDay[key] ?? []
          const blocks  = layoutDayEntries(dayEntries, day)

          // Ghost block for this column (if interact drag is active here)
          const showGhost = interactDrag !== null && interactDrag.colIndex === colIndex
          const ghostColor = showGhost
            ? (() => {
                const entry = entries.find(en => en.id === interactDrag!.entryId)
                const proj  = projects.find(p => p.id === entry?.project_id)
                return proj?.color ?? 'hsl(var(--primary))'
              })()
            : ''

          return (
            <div
              key={colIndex}
              data-col-index={colIndex}
              onMouseDown={e => handleColumnMouseDown(e, colIndex)}
              style={{
                position: 'relative',
                height: totalGridHeight,
                borderLeft: '1px solid hsl(0 0% 100% / 0.06)',
                background: isToday ? 'hsl(var(--primary) / 0.04)' : 'transparent',
                cursor: 'crosshair',
                userSelect: 'none',
              }}
            >
              {/* Hour grid lines */}
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    top: h * HOUR_HEIGHT,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'hsl(0 0% 100% / 0.04)',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Half-hour tick lines */}
              {HOURS.map(h => (
                <div
                  key={`h${h}`}
                  style={{
                    position: 'absolute',
                    top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'hsl(0 0% 100% / 0.02)',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Current time line (today only) */}
              {isToday && <CurrentTimeLine />}

              {/* Drag preview (live) */}
              {drag && drag.colIndex === colIndex && (
                <DragPreviewBlock drag={drag} />
              )}
              {/* Frozen preview while popup is open */}
              {!drag && frozenDrag && frozenDrag.colIndex === colIndex && (
                <DragPreviewBlock drag={frozenDrag} />
              )}

              {/* Interact drag ghost block */}
              {showGhost && (
                <InteractGhostBlock
                  startMin={interactDrag!.startMin}
                  endMin={interactDrag!.endMin}
                  color={ghostColor}
                />
              )}

              {/* Entry blocks */}
              {blocks.map(block => (
                <EntryBlock
                  key={block.entry.id}
                  block={block}
                  project={projects.find(p => p.id === block.entry.project_id)}
                  onMoveStart={(e, entry) => handleMoveStart(e, entry, colIndex)}
                  onResizeStart={(e, entry, edge) => handleResizeStart(e, entry, colIndex, edge)}
                  isDragging={interactDrag?.entryId === block.entry.id}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* ── Entry popup ────────────────────────────────────────────────────── */}
      {popup && (
        <EntryPopup
          popup={popup}
          projects={projects}
          onClose={() => { setPopup(null); setFrozenDrag(null) }}
          onSaved={() => {
            setPopup(null)
            setFrozenDrag(null)
            loadWeekEntries()
          }}
        />
      )}
    </div>
  )
}

// ─── Shared micro-styles ──────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'hsl(var(--muted-foreground))',
  cursor: 'pointer',
}

const todayBtnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 10px',
  borderRadius: 8,
  border: '1px solid hsl(var(--border))',
  background: 'transparent',
  color: 'hsl(var(--muted-foreground))',
  cursor: 'pointer',
  marginLeft: 4,
}
