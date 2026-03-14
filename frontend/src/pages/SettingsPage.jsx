import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { User, Users, Calendar, Plus, Trash2, Edit2, Check, X, LogOut, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const PRESET_COLORS = [
  '#E53E3E', '#D69E2E', '#8B6914', '#805AD5', '#38A169',
  '#3182CE', '#E53E3E', '#DD6B20', '#C05621', '#2D3748',
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
  const [newMember, setNewMember] = useState({ name: '', phone: '' })

  // new event
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', color: '#C05621' })

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
    const { error } = await supabase.from('family_members').insert({
      id,
      name: newMember.name.trim(),
      phone: newMember.phone.trim() || null,
    })
    if (error) return toast.error(error.message)
    toast.success(`${newMember.name} added!`)
    setNewMember({ name: '', phone: '' })
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

          {/* Phone */}
          <div className="mb-5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Phone</label>
            <div className="flex items-center gap-2 bg-paper rounded-xl px-4 py-3">
              <Phone size={15} className="text-muted" />
              <span className="text-muted">+91 {profile?.phone}</span>
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
              <h2 className="font-heading text-lg text-wtext">Family Members</h2>
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
                    placeholder="Phone (optional)"
                    type="tel"
                    value={newMember.phone}
                    onChange={e => setNewMember(p => ({ ...p, phone: e.target.value }))}
                  />
                  <button onClick={addMember} className="btn-primary">
                    Add Member
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
                  {member.phone && <p className="text-xs text-muted">+91 {member.phone}</p>}
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
              <h2 className="font-heading text-lg text-wtext">Wedding Events</h2>
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
                    placeholder="Event name *"
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
                    Add Event
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Events List */}
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                  <span className="font-medium text-wtext text-sm">{event.name}</span>
                  {event.is_default && (
                    <span className="text-xs text-muted bg-border/50 rounded-full px-2 py-0.5">default</span>
                  )}
                </div>
                {!event.is_default && (
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
