'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Pencil, Trash2, Shield, User as UserIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useDataStore, useAuthStore } from '@/stores'
import type { User } from '@/types'

type Role = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
}

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'text-red-400',
  MANAGER: 'text-amber-400',
  MEMBER: 'text-primary',
  VIEWER: 'text-muted-foreground',
}

interface InviteForm {
  email: string
  first_name: string
  last_name: string
  role: Role
}

const EMPTY_INVITE: InviteForm = { email: '', first_name: '', last_name: '', role: 'MEMBER' }

export default function TeamPage() {
  const { showToast } = useDataStore()
  const { user: currentUser } = useAuthStore()
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState<InviteForm>(EMPTY_INVITE)
  const [saving, setSaving] = useState(false)
  const [editMember, setEditMember] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<Role>('MEMBER')
  const [confirmRemove, setConfirmRemove] = useState<User | null>(null)

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'

  const load = () => {
    setLoading(true)
    api.get<User[]>('/team')
      .then(setMembers)
      .catch(() => showToast({ type: 'error', title: 'Failed to load team' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const handleInvite = async () => {
    if (!invite.email || !invite.first_name) return
    setSaving(true)
    try {
      const member = await api.post<User>('/team', invite)
      setMembers(prev => [...prev.filter(m => m.id !== member.id), member].sort((a, b) => a.first_name.localeCompare(b.first_name)))
      setShowInvite(false)
      setInvite(EMPTY_INVITE)
      showToast({ type: 'success', title: 'Member invited' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to invite member' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editMember) return
    setSaving(true)
    try {
      const updated = await api.put<User>(`/team/${editMember.id}`, { role: editRole })
      setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))
      setEditMember(null)
      showToast({ type: 'success', title: 'Role updated' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to update role' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirmRemove) return
    setSaving(true)
    try {
      await api.delete(`/team/${confirmRemove.id}`)
      setMembers(prev => prev.filter(m => m.id !== confirmRemove.id))
      setConfirmRemove(null)
      showToast({ type: 'success', title: 'Member removed' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to remove member' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Team</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          )}
        </div>

        {/* Member list */}
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">No team members yet</div>
        ) : (
          <div className="bento-card divide-y divide-border/30">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 group">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-primary text-xs font-semibold"
                  style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                  {member.first_name[0]?.toUpperCase() ?? <UserIcon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.first_name} {member.last_name}
                    {member.id === currentUser?.id && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium flex items-center gap-1 ${ROLE_COLORS[member.role as Role]}`}>
                    {member.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                    {ROLE_LABELS[member.role as Role] ?? member.role}
                  </span>
                  {!member.is_active && (
                    <span className="text-[10px] text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5">inactive</span>
                  )}
                  {canManage && member.id !== currentUser?.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditMember(member); setEditRole(member.role as Role) }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="Change role"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmRemove(member)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <Modal title="Invite team member" onClose={() => { setShowInvite(false); setInvite(EMPTY_INVITE) }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input className="form-input" value={invite.first_name} onChange={e => setInvite(p => ({ ...p, first_name: e.target.value }))} placeholder="Jane" />
              </Field>
              <Field label="Last name">
                <input className="form-input" value={invite.last_name} onChange={e => setInvite(p => ({ ...p, last_name: e.target.value }))} placeholder="Doe" />
              </Field>
            </div>
            <Field label="Email">
              <input className="form-input" type="email" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" />
            </Field>
            <Field label="Role">
              <select className="form-input" value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value as Role }))}>
                {(Object.keys(ROLE_LABELS) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
            <p className="text-xs text-muted-foreground">A temporary password will be generated. The user can change it in settings.</p>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => { setShowInvite(false); setInvite(EMPTY_INVITE) }} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleInvite} disabled={saving || !invite.email || !invite.first_name} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Inviting…' : 'Send invite'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit role modal */}
      {editMember && (
        <Modal title={`Change role — ${editMember.first_name}`} onClose={() => setEditMember(null)}>
          <Field label="Role">
            <select className="form-input" value={editRole} onChange={e => setEditRole(e.target.value as Role)}>
              {(Object.keys(ROLE_LABELS) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setEditMember(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleUpdateRole} disabled={saving} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Update role'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <Modal title="Remove member?" onClose={() => setConfirmRemove(null)}>
          <p className="text-sm text-muted-foreground">
            Remove <span className="text-foreground font-medium">{confirmRemove.first_name} {confirmRemove.last_name}</span> from the organization? They will lose access immediately.
          </p>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setConfirmRemove(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleRemove} disabled={saving} className="flex-1 text-sm py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
              {saving ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bento-card p-6 w-full max-w-md rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
