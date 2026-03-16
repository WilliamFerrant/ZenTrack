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

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
      <div className="w-full max-w-md">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'org' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              {step === 'org' ? '1' : '✓'}
            </div>
            <span className={`text-sm font-medium ${step === 'org' ? 'text-white' : 'text-green-400'}`}>Organization</span>
          </div>
          <div className="w-8 h-px bg-zinc-600" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'team' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div>
            <span className={`text-sm font-medium ${step === 'team' ? 'text-white' : 'text-zinc-500'}`}>Team</span>
          </div>
        </div>

        <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-8">
          {step === 'org' ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Create your organization</h1>
                <p className="text-zinc-400 text-sm">This is your workspace. You can invite members later.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Organization name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Inc."
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !orgName.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating...
                    </span>
                  ) : 'Continue →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Create your first team</h1>
                <p className="text-zinc-400 text-sm">Teams help you organize members within your organization.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Team name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Design, Engineering, Sales..."
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating...
                    </span>
                  ) : teamName.trim() ? 'Create team & get started →' : 'Skip for now →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
