'use client'

import { useEffect, useState } from 'react'
import { Building2, Plus, Pencil, Trash2, Mail, Phone, Globe, X, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useDataStore } from '@/stores'
import type { Client } from '@/types'

interface ClientForm {
  name: string
  email: string
  phone: string
  address: string
  website: string
  notes: string
}

const EMPTY_FORM: ClientForm = { name: '', email: '', phone: '', address: '', website: '', notes: '' }

export default function ClientsPage() {
  const { showToast } = useDataStore()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setIsLoading(true)
    try {
      const data = await api.get<Client[]>('/clients')
      setClients(data)
    } catch {
      showToast({ type: 'error', title: 'Failed to load clients' })
    }
    setIsLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function openCreate() {
    setEditingClient(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      website: client.website ?? '',
      notes: client.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      if (editingClient) {
        const updated = await api.put<Client>(`/clients/${editingClient.id}`, payload)
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
        showToast({ type: 'success', title: 'Client updated' })
      } else {
        const created = await api.post<Client>('/clients', payload)
        setClients(prev => [...prev, created])
        showToast({ type: 'success', title: 'Client created' })
      }
      setShowModal(false)
    } catch {
      showToast({ type: 'error', title: 'Failed to save client' })
    }
    setSaving(false)
  }

  async function handleDelete(client: Client) {
    setDeletingId(client.id)
    try {
      await api.delete(`/clients/${client.id}`)
      setClients(prev => prev.filter(c => c.id !== client.id))
      showToast({ type: 'success', title: 'Client deleted' })
    } catch {
      showToast({ type: 'error', title: 'Failed to delete client' })
    }
    setDeletingId(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="bento-card py-20 text-center">
            <Building2 className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-foreground/60 text-sm">No clients yet</p>
            <button onClick={openCreate} className="mt-4 text-xs text-primary hover:underline">Add your first client</button>
          </div>
        ) : (
          <div className="bento-card overflow-hidden">
            {clients.map((client, idx) => (
              <ClientRow
                key={client.id}
                client={client}
                borderTop={idx > 0}
                isDeleting={deletingId === client.id}
                onEdit={() => openEdit(client)}
                onDelete={() => handleDelete(client)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ClientModal
          form={form}
          setForm={setForm}
          isEditing={!!editingClient}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function ClientRow({ client, borderTop, isDeleting, onEdit, onDelete }: {
  client: Client
  borderTop: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors ${borderTop ? 'border-t border-border/30' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Building2 className="w-4 h-4 text-primary/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {client.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{client.email}</span>}
          {client.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{client.phone}</span>}
          {client.website && <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{client.website}</span>}
        </div>
      </div>
      <div className={`flex gap-1 flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Sure?</span>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setConfirmDelete(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function ClientModal({ form, setForm, isEditing, saving, onSave, onClose }: {
  form: ClientForm
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>
  isEditing: boolean
  saving: boolean
  onSave: () => void
  onClose: () => void
}) {
  const field = (key: keyof ClientForm, label: string, placeholder: string, required = false) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bento-card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{isEditing ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {field('name', 'Name', 'Acme Corp', true)}
          {field('email', 'Email', 'contact@acme.com')}
          {field('phone', 'Phone', '+1 555 000 0000')}
          {field('website', 'Website', 'https://acme.com')}
          {field('address', 'Address', '123 Main St, City, Country')}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes</label>
            <textarea
              className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              rows={2}
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
          <button
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  )
}
