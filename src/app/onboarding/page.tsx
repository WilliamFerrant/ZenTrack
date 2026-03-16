'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { api } from '@/lib/api'

type Step = 'org' | 'team'

export default function OnboardingPage() {
  const router = useRouter()
  const { loadUser } = useAuthStore()

  const [step, setStep] = useState<Step>('org')
  const [orgName, setOrgName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [orgId, setOrgId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const org = await api.post<{ id: number }>('/organizations', { name: orgName.trim() })
      setOrgId(org.id)
      await loadUser()
      setStep('team')
    } catch (err: any) {
      setError(err?.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) { router.replace('/app/tracking'); return }
    setLoading(true)
    setError(null)
    try {
      await api.post('/teams', { name: teamName.trim() })
      router.replace('/app/tracking')
    } catch (err: any) {
      setError(err?.message || 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-white/[0.06] border border-border/40 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
  const btnClass = "w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'org' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              {step === 'org' ? '1' : '✓'}
            </div>
            <span className={`text-sm font-medium ${step === 'org' ? 'text-foreground' : 'text-green-400'}`}>Organization</span>
          </div>
          <div className="w-8 h-px bg-border/40" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'team' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-muted-foreground'}`}>2</div>
            <span className={`text-sm font-medium ${step === 'team' ? 'text-foreground' : 'text-muted-foreground'}`}>Team</span>
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          {step === 'org' ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-1">Create your organization</h1>
                <p className="text-muted-foreground text-sm">This is your workspace. You can invite members later.</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Organization name</label>
                  <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className={inputClass} placeholder="Acme Inc." autoFocus />
                </div>
                <button type="submit" disabled={loading || !orgName.trim()} className={btnClass}>
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Creating...</span> : 'Continue →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-1">Create your first team</h1>
                <p className="text-muted-foreground text-sm">Teams help you organize members within your organization.</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Team name</label>
                  <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className={inputClass} placeholder="Design, Engineering, Sales..." autoFocus />
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Creating...</span> : teamName.trim() ? 'Create team & get started →' : 'Skip for now →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
