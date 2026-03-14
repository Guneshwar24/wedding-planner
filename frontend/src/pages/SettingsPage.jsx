import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Edit2, Check, X, Plus, Trash2, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import BottomNav from '../components/BottomNav'

const PRESET_COLORS = [
  '#E53E3E', '#D69E2E', '#8B6914', '#805AD5', '#38A169',
  '#C05621', '#3182CE', '#D53F8C', '#2D3748', '#718096',
]

const DEFAULT_EVENT_NAMES = ['Sangeet', 'Mayara', 'Varmala', 'Haldi', 'Mehandi']

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(user?.name || '')

  const [family, setFamily] = useState([])
  const [events, setEvents] = useState([])
  const [loadingFamily, setLoadingFamily] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)

  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const [newEventName, setNewEventName] = useState('')
  const [newEventColor, setNewEventColor] = useState('#C05621')
  const [addingEvent, setAddingEvent] = useState(false)

  useEffect(() => {
    client.get('/api/family-members')
      .then(res => setFamily(res.data))
      .catch(() => toast.error('Failed to load family members'))
      .finally(() => setLoadingFamily(false))

    client.get('/api/events')
      .then(res => setEvents(res.data))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoadingEvents(false))
  }, [])

  async function saveName() {
    try {
      await updateUser(nameValue)
      setEditingName(false)
      toast.success('Name updated!')
    } catch {
      toast.error('Failed to update name')
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function addMember(e) {
    e.preventDefault()
    if (!newMemberName.trim()) return toast.error('Name is required')
    try {
      const res = await client.post('/api/family-members', {
        name: newMemberName.trim(),
        phone: newMemberPhone.trim() || null,
      })
      setFamily(prev => [...prev, res.data])
      setNewMemberName('')
      setNewMemberPhone('')
      setAddingMember(false)
      toast.success('Family member added!')
    } catch {
      toast.error('Failed to add family member')
    }
  }

  async function deleteMember(id) {
    try {
      await client.delete(`/api/family-members/${id}`)
      setFamily(prev => prev.filter(m => m.id !== id))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  async function addEvent(e) {
    e.preventDefault()
    if (!newEventName.trim()) return toast.error('Event name is required')
    try {
      const res = await client.post('/api/events', {
        name: newEventName.trim(),
        color: newEventColor,
      })
      setEvents(prev => [...prev, res.data])
      setNewEventName('')
      setNewEventColor('#C05621')
      setAddingEvent(false)
      toast.success('Event added!')
    } catch {
      toast.error('Failed to add event')
    }
  }

  async function deleteEvent(id) {
    try {
      await client.delete(`/api/events/${id}`)
      setEvents(prev => prev.filter(e => e.id !== id))
      toast.success('Event removed')
    } catch {
      toast.error('Failed to remove event')
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FDFBF7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(160deg, #FFF5F0 0%, #FDFBF7 100%)' }}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
          Settings
        </h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
            Your Profile
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: 'linear-gradient(135deg, #C05621, #D69E2E)' }}
            >
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#C05621', color: '#4A3A35' }}
                    autoFocus
                  />
                  <button onClick={saveName} className="p-1.5 rounded-lg" style={{ background: '#38A16920', color: '#38A169' }}>
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameValue(user?.name || '') }}
                    className="p-1.5 rounded-lg"
                    style={{ background: '#E2D8D020', color: '#8C7B75' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: '#4A3A35' }}>{user?.name}</span>
                  <button onClick={() => setEditingName(true)} className="p-1" style={{ color: '#8C7B75' }}>
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <Phone size={12} style={{ color: '#8C7B75' }} />
                <span className="text-sm" style={{ color: '#8C7B75' }}>+91 {user?.phone}</span>
              </div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#FFF5F0', color: '#C05621', border: '1px solid #C05621' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </motion.div>

        {/* Family Members */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
              Family Members
            </h2>
            <button
              onClick={() => setAddingMember(v => !v)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium"
              style={{ background: '#C0562115', color: '#C05621', border: '1px solid #C05621' }}
            >
              {addingMember ? <X size={12} /> : <Plus size={12} />}
              {addingMember ? 'Cancel' : 'Add'}
            </button>
          </div>

          {addingMember && (
            <form onSubmit={addMember} className="mb-4 p-3 rounded-xl space-y-2" style={{ background: '#FFF5F0' }}>
              <input
                type="text"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                placeholder="Name *"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
              />
              <input
                type="tel"
                value={newMemberPhone}
                onChange={e => setNewMemberPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone (optional)"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #C05621, #9C4215)' }}
              >
                Add Member
              </button>
            </form>
          )}

          {loadingFamily ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : family.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: '#8C7B75' }}>No family members yet</p>
          ) : (
            <div className="space-y-2">
              {family.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                  style={{ background: '#FFF5F0' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: '#C05621' }}
                  >
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#4A3A35' }}>{member.name}</p>
                    {member.phone && (
                      <p className="text-xs" style={{ color: '#8C7B75' }}>+91 {member.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMember(member.id)}
                    className="p-1.5 rounded-lg flex-shrink-0"
                    style={{ color: '#8C7B75' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Wedding Events */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
              Wedding Events
            </h2>
            <button
              onClick={() => setAddingEvent(v => !v)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium"
              style={{ background: '#C0562115', color: '#C05621', border: '1px solid #C05621' }}
            >
              {addingEvent ? <X size={12} /> : <Plus size={12} />}
              {addingEvent ? 'Cancel' : 'Add'}
            </button>
          </div>

          {addingEvent && (
            <form onSubmit={addEvent} className="mb-4 p-3 rounded-xl space-y-3" style={{ background: '#FFF5F0' }}>
              <input
                type="text"
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
                placeholder="Event name *"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
              />
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#4A3A35' }}>Color</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewEventColor(c)}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        background: c,
                        transform: newEventColor === c ? 'scale(1.25)' : 'scale(1)',
                        boxShadow: newEventColor === c ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #C05621, #9C4215)' }}
              >
                Add Event
              </button>
            </form>
          )}

          {loadingEvents ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: '#8C7B75' }}>No events yet</p>
          ) : (
            <div className="space-y-2">
              {events.map(event => {
                const isDefault = DEFAULT_EVENT_NAMES.some(
                  n => n.toLowerCase() === event.name.toLowerCase()
                )
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                    style={{ background: event.color + '10' }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ background: event.color }}
                    />
                    <span className="flex-1 text-sm font-medium" style={{ color: '#4A3A35' }}>
                      {event.name}
                    </span>
                    {isDefault ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E2D8D0', color: '#8C7B75' }}>
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ color: '#8C7B75' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}
