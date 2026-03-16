'use client'

import { useEffect, useState } from 'react'
import {
  UserPlus, Pencil, Trash2, Shield, User as UserIcon,
  Building2, Plus, ArrowRightLeft, ChevronDown, ChevronUp, Users, X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useDataStore, useAuthStore } from '@/stores'
import type { User } from '@/types'

type Role = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

interface Org {
  id: number; name: string; slug: string; description?: string; website?: string; my_role?: string
}

interface TeamMember {
  id: number; first_name: string; last_name: string; email: string; role: string
}

interface Team {
  id: number; name: string; description?: string; color?: string
  organization_id: number; members: TeamMember[]
}

const ROLE_LABELS: Record<Role, string> = { ADMIN: 'Admin', MANAGER: 'Manager', MEMBER: 'Member', VIEWER: 'Viewer' }
const ROLE_COLORS: Record<Role, string> = { ADMIN: 'text-red-400', MANAGER: 'text-amber-400', MEMBER: 'text-primary', VIEWER: 'text-muted-foreground' }
const TEAM_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#06B6D4','#94A3B8']

interface InviteForm { email: string; first_name: string; last_name: string; role: Role }
const EMPTY_INVITE: InviteForm = { email: '', first_name: '', last_name: '', role: 'MEMBER' }

export default function TeamPage() {
  const { showToast } = useDataStore()
  const { user: currentUser, loadUser } = useAuthStore() as any

  const [orgs, setOrgs]             = useState<Org[]>([])
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null)
  const [members, setMembers]       = useState<User[]>([])
  const [teams, setTeams]           = useState<Team[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set())

  // Invite member
  const [showInvite, setShowInvite]       = useState(false)
  const [invite, setInvite]               = useState<InviteForm>(EMPTY_INVITE)

  // Edit member role
  const [editMember, setEditMember]       = useState<User | null>(null)
  const [editRole, setEditRole]           = useState<Role>('MEMBER')
  const [confirmRemove, setConfirmRemove] = useState<User | null>(null)

  // Org modals
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showEditOrg, setShowEditOrg]     = useState(false)
  const [orgForm, setOrgForm]             = useState({ name: '', description: '', website: '' })

  // Team modals
  const [showCreateTeam, setShowCreateTeam]         = useState(false)
  const [editTeam, setEditTeam]                     = useState<Team | null>(null)
  const [confirmDeleteTeam, setConfirmDeleteTeam]   = useState<Team | null>(null)
  const [showAddToTeam, setShowAddToTeam]           = useState<Team | null>(null)
  const [teamForm, setTeamForm]                     = useState({ name: '', description: '', color: TEAM_COLORS[0] })

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
  const isAdmin   = currentUser?.role === 'ADMIN'

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      api.get<Org[]>('/organizations'),
      api.get<Org>('/organizations/current').catch(() => null),
      api.get<User[]>('/team'),
      api.get<Team[]>('/teams'),
    ]).then(([orgsData, orgData, membersData, teamsData]) => {
      setOrgs(orgsData)
      setCurrentOrg(orgData)
      setMembers(membersData)
      setTeams(teamsData)
    }).catch(() => showToast({ type: 'error', title: 'Failed to load team' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  // ── Org actions ─────────────────────────────────────────────────────────────

  const handleSwitchOrg = async (orgId: number) => {
    if (orgId === currentOrg?.id) return
    setSaving(true)
    try {
      const org = await api.post<Org>(`/organizations/${orgId}/switch`, {})
      setCurrentOrg(org)
      if (loadUser) await loadUser()
      const [newMembers, newTeams] = await Promise.all([api.get<User[]>('/team'), api.get<Team[]>('/teams')])
      setMembers(newMembers)
      setTeams(newTeams)
      showToast({ type: 'success', title: `Switched to ${org.name}` })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to switch' })
    } finally { setSaving(false) }
  }

  const handleCreateOrg = async () => {
    if (!orgForm.name.trim()) return
    setSaving(true)
    try {
      const org = await api.post<Org>('/organizations', orgForm)
      setOrgs(prev => [...prev, org])
      setCurrentOrg(org)
      setOrgForm({ name: '', description: '', website: '' })
      setShowCreateOrg(false)
      if (loadUser) await loadUser()
      const [newMembers, newTeams] = await Promise.all([api.get<User[]>('/team'), api.get<Team[]>('/teams')])
      setMembers(newMembers)
      setTeams(newTeams)
      showToast({ type: 'success', title: `"${org.name}" created` })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to create org' })
    } finally { setSaving(false) }
  }

  const handleUpdateOrg = async () => {
    if (!orgForm.name.trim()) return
    setSaving(true)
    try {
      const org = await api.put<Org>('/organizations/current', orgForm)
      setCurrentOrg(org)
      setOrgs(prev => prev.map(o => o.id === org.id ? org : o))
      setShowEditOrg(false)
      showToast({ type: 'success', title: 'Organization updated' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to update org' })
    } finally { setSaving(false) }
  }

  // ── Member actions ───────────────────────────────────────────────────────────

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
      showToast({ type: 'error', title: e?.message ?? 'Failed to invite' })
    } finally { setSaving(false) }
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
    } finally { setSaving(false) }
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
      showToast({ type: 'error', title: e?.message ?? 'Failed to remove' })
    } finally { setSaving(false) }
  }

  // ── Team actions ─────────────────────────────────────────────────────────────

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) return
    setSaving(true)
    try {
      const team = await api.post<Team>('/teams', teamForm)
      setTeams(prev => [...prev, team])
      setShowCreateTeam(false)
      setTeamForm({ name: '', description: '', color: TEAM_COLORS[0] })
      showToast({ type: 'success', title: `Team "${team.name}" created` })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to create team' })
    } finally { setSaving(false) }
  }

  const handleUpdateTeam = async () => {
    if (!editTeam || !teamForm.name.trim()) return
    setSaving(true)
    try {
      const updated = await api.put<Team>(`/teams/${editTeam.id}`, teamForm)
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))
      setEditTeam(null)
      showToast({ type: 'success', title: 'Team updated' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to update team' })
    } finally { setSaving(false) }
  }

  const handleDeleteTeam = async () => {
    if (!confirmDeleteTeam) return
    setSaving(true)
    try {
      await api.delete(`/teams/${confirmDeleteTeam.id}`)
      setTeams(prev => prev.filter(t => t.id !== confirmDeleteTeam.id))
      setConfirmDeleteTeam(null)
      showToast({ type: 'success', title: 'Team deleted' })
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to delete team' })
    } finally { setSaving(false) }
  }

  const handleAddToTeam = async (team: Team, userId: number) => {
    setSaving(true)
    try {
      const updated = await api.post<Team>(`/teams/${team.id}/members`, { user_id: userId })
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))
      setShowAddToTeam(updated)
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to add member' })
    } finally { setSaving(false) }
  }

  const handleRemoveFromTeam = async (teamId: number, userId: number) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== userId) } : t
      ))
    } catch (e: any) {
      showToast({ type: 'error', title: e?.message ?? 'Failed to remove from team' })
    }
  }

  const toggleTeam = (id: number) =>
    setExpandedTeams(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // Members not in any team
  const teamMemberIds = new Set(teams.flatMap(t => t.members.map(m => m.id)))
  const unassignedMembers = members.filter(m => !teamMemberIds.has(Number(m.id)))

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Team</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setOrgForm({ name: '', description: '', website: '' }); setShowCreateOrg(true) }}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-border/40 bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              New org
            </button>
            {canManage && (
              <button
                onClick={() => { setTeamForm({ name: '', description: '', color: TEAM_COLORS[0] }); setShowCreateTeam(true) }}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-border/40 bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-4 h-4" />
                New team
              </button>
            )}
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
        </div>

        {/* Organizations */}
        {orgs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Organizations</p>
            <div className="bento-card divide-y divide-border/20">
              {orgs.map(org => {
                const isActive = org.id === currentOrg?.id
                return (
                  <div key={org.id} className="flex items-center gap-3 px-5 py-3.5 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--primary) / 0.08)' }}>
                      <Building2 className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{org.name}</p>
                        {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 flex-shrink-0">active</span>}
                      </div>
                      {org.description && <p className="text-xs text-muted-foreground/60 truncate">{org.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {org.my_role && (
                        <span className={`text-xs font-medium ${ROLE_COLORS[org.my_role as Role] ?? 'text-muted-foreground'}`}>
                          {ROLE_LABELS[org.my_role as Role] ?? org.my_role}
                        </span>
                      )}
                      {!isActive && (
                        <button onClick={() => handleSwitchOrg(org.id)} disabled={saving}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors opacity-0 group-hover:opacity-100">
                          <ArrowRightLeft className="w-3 h-3" /> Switch
                        </button>
                      )}
                      {isActive && isAdmin && (
                        <button onClick={() => { setOrgForm({ name: org.name, description: org.description ?? '', website: org.website ?? '' }); setShowEditOrg(true) }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* Teams */}
            {teams.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  Teams {currentOrg ? `— ${currentOrg.name}` : ''}
                </p>
                <div className="space-y-2">
                  {teams.map(team => {
                    const expanded = expandedTeams.has(team.id)
                    return (
                      <div key={team.id} className="bento-card overflow-hidden">
                        {/* Team header row */}
                        <button
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors group"
                          onClick={() => toggleTeam(team.id)}
                        >
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: team.color ?? '#3B82F6' }} />
                          <span className="flex-1 text-sm font-medium text-foreground">{team.name}</span>
                          {team.description && (
                            <span className="text-xs text-muted-foreground/60 hidden sm:block mr-2">{team.description}</span>
                          )}
                          <span className="text-xs text-muted-foreground mr-1">
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                          </span>
                          {/* Avatars preview */}
                          <div className="flex -space-x-1.5 mr-2">
                            {team.members.slice(0, 4).map(m => (
                              <div key={m.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold border border-background"
                                style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
                                {m.first_name[0]?.toUpperCase()}
                              </div>
                            ))}
                            {team.members.length > 4 && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold border border-background bg-white/10 text-muted-foreground">
                                +{team.members.length - 4}
                              </div>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setTeamForm({ name: team.name, description: team.description ?? '', color: team.color ?? TEAM_COLORS[0] }); setEditTeam(team) }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" title="Edit team">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setConfirmDeleteTeam(team)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete team">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        </button>

                        {/* Expanded member list */}
                        {expanded && (
                          <div className="border-t border-border/20 px-5 py-3 space-y-1">
                            {team.members.length === 0 ? (
                              <p className="text-xs text-muted-foreground/60 py-2">No members yet</p>
                            ) : (
                              team.members.map(m => (
                                <div key={m.id} className="flex items-center gap-3 py-1.5 group/member">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                                    style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                                    {m.first_name[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground">{m.first_name} {m.last_name}</p>
                                    <p className="text-[10px] text-muted-foreground">{m.email}</p>
                                  </div>
                                  <span className={`text-[10px] font-medium ${ROLE_COLORS[m.role as Role] ?? 'text-muted-foreground'}`}>
                                    {ROLE_LABELS[m.role as Role] ?? m.role}
                                  </span>
                                  {canManage && (
                                    <button onClick={() => handleRemoveFromTeam(team.id, m.id)}
                                      className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 opacity-0 group-hover/member:opacity-100 transition-all">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                            {canManage && (
                              <button onClick={() => setShowAddToTeam(team)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-2 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> Add member
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Unassigned members */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                {teams.length > 0 ? 'Unassigned members' : `Members${currentOrg ? ` — ${currentOrg.name}` : ''}`}
              </p>
              {members.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No members yet</div>
              ) : (
                <div className="bento-card divide-y divide-border/30">
                  {(teams.length > 0 ? unassignedMembers : members).map(member => (
                    <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 group">
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
                        {canManage && member.id !== currentUser?.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditMember(member); setEditRole(member.role as Role) }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" title="Change role">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmRemove(member)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Remove">
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
          </>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Invite */}
      {showInvite && (
        <Modal title="Invite member" onClose={() => { setShowInvite(false); setInvite(EMPTY_INVITE) }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name"><input className="form-input" value={invite.first_name} onChange={e => setInvite(p => ({ ...p, first_name: e.target.value }))} placeholder="Jane" /></Field>
              <Field label="Last name"><input className="form-input" value={invite.last_name} onChange={e => setInvite(p => ({ ...p, last_name: e.target.value }))} placeholder="Doe" /></Field>
            </div>
            <Field label="Email"><input className="form-input" type="email" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" /></Field>
            <Field label="Role">
              <select className="form-input" value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value as Role }))}>
                {(Object.keys(ROLE_LABELS) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
            <p className="text-xs text-muted-foreground">A temporary password will be generated.</p>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => { setShowInvite(false); setInvite(EMPTY_INVITE) }} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleInvite} disabled={saving || !invite.email || !invite.first_name} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Inviting…' : 'Invite'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit role */}
      {editMember && (
        <Modal title={`Change role — ${editMember.first_name}`} onClose={() => setEditMember(null)}>
          <Field label="Role">
            <select className="form-input" value={editRole} onChange={e => setEditRole(e.target.value as Role)}>
              {(Object.keys(ROLE_LABELS) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setEditMember(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleUpdateRole} disabled={saving} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Update'}</button>
          </div>
        </Modal>
      )}

      {/* Confirm remove member */}
      {confirmRemove && (
        <Modal title="Remove from organization?" onClose={() => setConfirmRemove(null)}>
          <p className="text-sm text-muted-foreground">
            Remove <span className="text-foreground font-medium">{confirmRemove.first_name} {confirmRemove.last_name}</span> from <span className="text-foreground font-medium">{currentOrg?.name}</span>? Their account is preserved.
          </p>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setConfirmRemove(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleRemove} disabled={saving} className="flex-1 text-sm py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">{saving ? 'Removing…' : 'Remove'}</button>
          </div>
        </Modal>
      )}

      {/* Create org */}
      {showCreateOrg && (
        <Modal title="New organization" onClose={() => setShowCreateOrg(false)}>
          <div className="space-y-3">
            <Field label="Name"><input className="form-input" autoFocus value={orgForm.name} onChange={e => setOrgForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Inc." /></Field>
            <Field label="Description"><input className="form-input" value={orgForm.description} onChange={e => setOrgForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" /></Field>
            <Field label="Website"><input className="form-input" value={orgForm.website} onChange={e => setOrgForm(p => ({ ...p, website: e.target.value }))} placeholder="https://…" /></Field>
            <p className="text-xs text-muted-foreground">You&apos;ll be set as admin. Your active org will switch to this one.</p>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setShowCreateOrg(false)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreateOrg} disabled={saving || !orgForm.name.trim()} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Creating…' : 'Create'}</button>
          </div>
        </Modal>
      )}

      {/* Edit org */}
      {showEditOrg && (
        <Modal title="Edit organization" onClose={() => setShowEditOrg(false)}>
          <div className="space-y-3">
            <Field label="Name"><input className="form-input" autoFocus value={orgForm.name} onChange={e => setOrgForm(p => ({ ...p, name: e.target.value }))} /></Field>
            <Field label="Description"><input className="form-input" value={orgForm.description} onChange={e => setOrgForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" /></Field>
            <Field label="Website"><input className="form-input" value={orgForm.website} onChange={e => setOrgForm(p => ({ ...p, website: e.target.value }))} placeholder="https://…" /></Field>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setShowEditOrg(false)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleUpdateOrg} disabled={saving || !orgForm.name.trim()} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {/* Create/edit team */}
      {(showCreateTeam || editTeam) && (
        <Modal title={editTeam ? 'Edit team' : 'New team'} onClose={() => { setShowCreateTeam(false); setEditTeam(null) }}>
          <div className="space-y-3">
            <Field label="Name"><input className="form-input" autoFocus value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dev, Design, Marketing" /></Field>
            <Field label="Description"><input className="form-input" value={teamForm.description} onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" /></Field>
            <Field label="Color">
              <div className="flex gap-2 flex-wrap mt-1">
                {TEAM_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setTeamForm(p => ({ ...p, color: c }))}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{ background: c, boxShadow: teamForm.color === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}` : 'none', transform: teamForm.color === c ? 'scale(1.2)' : 'scale(1)' }} />
                ))}
              </div>
            </Field>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => { setShowCreateTeam(false); setEditTeam(null) }} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={editTeam ? handleUpdateTeam : handleCreateTeam} disabled={saving || !teamForm.name.trim()}
              className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : editTeam ? 'Save' : 'Create team'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add member to team */}
      {showAddToTeam && (
        <Modal title={`Add to ${showAddToTeam.name}`} onClose={() => setShowAddToTeam(null)}>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {members.filter(m => !showAddToTeam.members.some(tm => tm.id === Number(m.id))).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All org members are already in this team.</p>
            ) : (
              members.filter(m => !showAddToTeam.members.some(tm => tm.id === Number(m.id))).map(m => (
                <button key={m.id} onClick={() => handleAddToTeam(showAddToTeam, Number(m.id))} disabled={saving}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors disabled:opacity-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                    {m.first_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className={`text-xs ${ROLE_COLORS[m.role as Role]}`}>{ROLE_LABELS[m.role as Role]}</span>
                </button>
              ))
            )}
          </div>
          <button onClick={() => setShowAddToTeam(null)} className="w-full mt-4 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Done</button>
        </Modal>
      )}

      {/* Delete team confirm */}
      {confirmDeleteTeam && (
        <Modal title="Delete team?" onClose={() => setConfirmDeleteTeam(null)}>
          <p className="text-sm text-muted-foreground">
            Delete <span className="text-foreground font-medium">{confirmDeleteTeam.name}</span>? Members will not be removed from the organization.
          </p>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setConfirmDeleteTeam(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleDeleteTeam} disabled={saving} className="flex-1 text-sm py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">{saving ? 'Deleting…' : 'Delete'}</button>
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
