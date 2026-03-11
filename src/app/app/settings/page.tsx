'use client'

import { useState } from 'react'
import { User, Lock, Bell, Palette, LogOut, ChevronRight, Save } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'

type Tab = 'profile' | 'appearance' | 'notifications' | 'security'

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'profile',       icon: <User className="w-4 h-4" />,    label: 'Profile' },
  { id: 'appearance',    icon: <Palette className="w-4 h-4" />, label: 'Appearance' },
  { id: 'notifications', icon: <Bell className="w-4 h-4" />,    label: 'Notifications' },
  { id: 'security',      icon: <Lock className="w-4 h-4" />,    label: 'Security' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const { user, logout, setUser } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    try { await logout() } catch {}
    router.push('/login')
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
        </div>

        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-44 flex-shrink-0 space-y-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  tab === t.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}

            <div className="pt-3 mt-3 border-t border-border/30">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'profile'       && <ProfileTab user={user} setUser={setUser} />}
            {tab === 'appearance'    && <AppearanceTab />}
            {tab === 'notifications' && <NotificationsTab />}
            {tab === 'security'      && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName,  setLastName]  = useState(user?.last_name ?? '')
  const [email,     setEmail]     = useState(user?.email ?? '')
  const [timezone,  setTimezone]  = useState(user?.timezone ?? 'UTC')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setUser({ ...user, first_name: firstName, last_name: lastName, timezone })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bento-card p-5 space-y-5">
      <h2 className="text-sm font-medium text-foreground">Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-primary font-semibold text-xl"
          style={{ background: 'hsl(var(--primary) / 0.15)' }}
        >
          {(firstName[0] ?? user?.first_name?.[0] ?? 'U').toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-muted-foreground">{email}</p>
          <span className="text-[10px] px-2 py-0.5 mt-1 inline-block rounded-full bg-primary/10 text-primary border border-primary/20">
            {user?.role ?? 'MEMBER'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" value={firstName} onChange={setFirstName} />
        <Field label="Last name"  value={lastName}  onChange={setLastName}  />
      </div>
      <Field label="Email" value={email} onChange={setEmail} type="email" disabled />
      <Field label="Timezone" value={timezone} onChange={setTimezone} />

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function AppearanceTab() {
  return (
    <div className="bento-card p-5 space-y-5">
      <h2 className="text-sm font-medium text-foreground">Appearance</h2>
      <div className="space-y-3">
        <SettingRow
          label="Theme"
          description="ZenTrack uses a dark theme designed for focus"
        >
          <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-border/40 text-muted-foreground">
            Dark
          </span>
        </SettingRow>
        <SettingRow
          label="Accent color"
          description="Primary teal accent"
        >
          <div className="w-5 h-5 rounded-full bg-primary border-2 border-primary/50" />
        </SettingRow>
        <SettingRow
          label="Sidebar"
          description="72px icon sidebar, always visible"
        >
          <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-border/40 text-muted-foreground">
            Fixed
          </span>
        </SettingRow>
      </div>
      <p className="text-xs text-muted-foreground/50 pt-2">
        More customization options coming soon.
      </p>
    </div>
  )
}

function NotificationsTab() {
  const [emailDigest, setEmailDigest] = useState(true)
  const [timerReminders, setTimerReminders] = useState(false)

  return (
    <div className="bento-card p-5 space-y-5">
      <h2 className="text-sm font-medium text-foreground">Notifications</h2>
      <div className="space-y-3">
        <ToggleRow
          label="Weekly email digest"
          description="Receive a weekly summary of your tracked time"
          value={emailDigest}
          onChange={setEmailDigest}
        />
        <ToggleRow
          label="Timer reminders"
          description="Get reminded if you forget to stop your timer"
          value={timerReminders}
          onChange={setTimerReminders}
        />
      </div>
      <p className="text-xs text-muted-foreground/50 pt-2">
        Notification settings are stored locally.
      </p>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="bento-card p-5 space-y-5">
      <h2 className="text-sm font-medium text-foreground">Security</h2>
      <div className="space-y-3">
        <SettingRow label="Password" description="Change your account password">
          <button className="text-xs px-3 py-1.5 rounded-xl border border-border/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            Change
          </button>
        </SettingRow>
        <SettingRow label="Sessions" description="Manage active sessions">
          <button className="text-xs px-3 py-1.5 rounded-xl border border-border/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            View
          </button>
        </SettingRow>
      </div>
      <p className="text-xs text-muted-foreground/50 pt-2">
        Full security management coming soon.
      </p>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', disabled,
}: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  )
}

function SettingRow({
  label, description, children,
}: {
  label: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  )
}

function ToggleRow({
  label, description, value, onChange,
}: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full flex-shrink-0 ml-4 transition-colors ${
          value ? 'bg-primary' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
            value ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
