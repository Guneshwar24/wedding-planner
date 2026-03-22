import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { User, Users, Calendar, Plus, Trash2, Edit2, Check, X, LogOut, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const PRESET_COLORS = [
  '#E53E3E', '#D69E2E', '#8B6914', '#805AD5', '#38A169',
  '#3182CE', '#DD6B20', '#C05621', '#2D3748', '#B7791F',
]

export default function SettingsPage() {
  const { user, profile, logout, updateName } = useAuth()
  const [familyMembers, setFamilyMembers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // profile edit
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // new family member
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', email: '' })

  // new event
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', color: '#C05621' })

  // edit event
  const [editingEventId, setEditingEventId] = useState(null)
  const [editEventData, setEditEventData] = useState({ name: '', color: '' })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (profile) setNameInput(profile.name)
  }, [profile])

  async function fetchData() {
    setLoading(true)
    const [membersRes, eventsRes] = await Promise.all([
      supabase.from('family_members').select('*').order('name'),
      supabase.from('events').select('*').order('created_at'),
    ])
    if (membersRes.error) toast.error('Failed to load family members')
    else setFamilyMembers(membersRes.data || [])
    if (eventsRes.error) toast.error('Failed to load events')
    else setEvents(eventsRes.data || [])
    setLoading(false)
  }

  async function saveName() {
    if (!nameInput.trim()) return
    try {
      await updateName(nameInput.trim())
      setEditingName(false)
      toast.success('Name updated!')
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function addMember() {
    if (!newMember.name.trim()) return toast.error('Name is required')
    const id = newMember.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const email = newMember.email.trim().toLowerCase() || null

    const { error } = await supabase.from('family_members').insert({
      id,
      name: newMember.name.trim(),
      email,
    })
    if (error) return toast.error(error.message)

    // Also whitelist their email so they can log in
    if (email) {
      const { error: wlError } = await supabase.from('whitelisted_emails').upsert(
        { email, name: newMember.name.trim(), is_admin: false },
        { onConflict: 'email' }
      )
      if (wlError) toast.error('Added person but failed to whitelist email: ' + wlError.message)
    }

    toast.success(`${newMember.name} added!`)
    setNewMember({ name: '', email: '' })
    setShowAddMember(false)
    fetchData()
  }

  async function deleteMember(id) {
    const { error } = await supabase.from('family_members').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Member removed')
    fetchData()
  }

  async function addEvent() {
    if (!newEvent.name.trim()) return toast.error('Event name is required')
    const id = newEvent.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const { error } = await supabase.from('events').insert({
      id,
      name: newEvent.name.trim(),
      color: newEvent.color,
      budget: 0,
      is_default: false,
    })
    if (error) return toast.error(error.message)
    toast.success(`${newEvent.name} event added!`)
    setNewEvent({ name: '', color: '#C05621' })
    setShowAddEvent(false)
    fetchData()
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Event removed')
    fetchData()
  }

  function startEditEvent(event) {
    setEditingEventId(event.id)
    setEditEventData({ name: event.name, color: event.color })
  }

  async function saveEvent() {
    if (!editEventData.name.trim()) return toast.error('Event name is required')
    const { error } = await supabase
      .from('events')
      .update({ name: editEventData.name.trim(), color: editEventData.color })
      .eq('id', editingEventId)
    if (error) return toast.error(error.message)
    toast.success('Event updated!')
    setEditingEventId(null)
    fetchData()
  }

  async function handleLogout() {
    await logout()
    toast.success('Logged out')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 text-center">
        <h1 className="font-heading text-2xl">Shaadi Brain</h1>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* ── User Profile ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-border p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <h2 className="font-heading text-lg text-wtext">User Profile</h2>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Name</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus
                />
                <button onClick={saveName} className="p-2 rounded-xl bg-success/10 text-success hover:bg-success/20">
                  <Check size={18} />
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(profile?.name || '') }} className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-paper rounded-xl px-4 py-3">
                <span className="text-wtext font-medium">{profile?.name}</span>
                <button onClick={() => setEditingName(true)} className="text-muted hover:text-primary transition-colors">
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Email</label>
            <div className="flex items-center gap-2 bg-paper rounded-xl px-4 py-3">
              <Mail size={15} className="text-muted" />
              <span className="text-muted text-sm">{profile?.email}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </motion.div>

        {/* ── Family Members ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Users size={20} className="text-gold" />
              </div>
              <h2 className="font-heading text-lg text-wtext">People</h2>
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add Member Form */}
          <AnimatePresence>
            {showAddMember && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-paper rounded-2xl p-4 space-y-3">
                  <input
                    className="input-field"
                    placeholder="Name *"
                    value={newMember.name}
                    onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className="input-field"
                    placeholder="Email (optional — whitelists login access)"
                    type="email"
                    value={newMember.email}
                    onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
                  />
                  <button onClick={addMember} className="btn-primary">
                    Add Person
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members List */}
          <div className="space-y-2">
            {familyMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-wtext text-sm">{member.name}</p>
                  {member.email && (
                    <p className="text-xs text-muted">{member.email}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteMember(member.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Wedding Events ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Calendar size={20} className="text-success" />
              </div>
              <h2 className="font-heading text-lg text-wtext">Wedding Functions</h2>
            </div>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add Event Form */}
          <AnimatePresence>
            {showAddEvent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-paper rounded-2xl p-4 space-y-3">
                  <input
                    className="input-field"
                    placeholder="Function name *"
                    value={newEvent.name}
                    onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))}
                  />
                  <div>
                    <label className="text-xs font-medium text-muted mb-2 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewEvent(p => ({ ...p, color }))}
                          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: newEvent.color === color ? '#4A3A35' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <button onClick={addEvent} className="btn-primary">
                    Add Function
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Events List */}
          <div className="space-y-0">
            {events.map(event => (
              <div key={event.id} className="border-b border-border/50 last:border-0">
                {editingEventId === event.id ? (
                  <div className="py-3 space-y-2">
                    <input
                      className="input-field"
                      value={editEventData.name}
                      onChange={e => setEditEventData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Function name *"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setEditEventData(p => ({ ...p, color }))}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: editEventData.color === color ? '#4A3A35' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEvent} className="flex-1 btn-primary text-sm py-1.5">
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEventId(null)}
                        className="px-3 py-1.5 rounded-xl text-sm text-muted border border-border hover:bg-cream transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                      <span className="font-medium text-wtext text-sm">{event.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditEvent(event)}
                        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      {!event.is_default && (
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
