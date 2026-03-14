import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Plus, X, ChevronDown, ChevronUp, Calendar, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import client from '../api/client'
import BottomNav from '../components/BottomNav'

const STATUSES = ['pending', 'in_progress', 'done']
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }
const STATUS_COLORS = { pending: '#D69E2E', in_progress: '#C05621', done: '#38A169' }

function EventBadge({ event }) {
  if (!event) return null
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: event.color + '25', color: event.color }}
    >
      {event.name}
    </span>
  )
}

function nextStatus(current) {
  const idx = STATUSES.indexOf(current)
  return STATUSES[(idx + 1) % STATUSES.length]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [family, setFamily] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterEvent, setFilterEvent] = useState(null)
  const [filterPerson, setFilterPerson] = useState(null)
  const [collapsed, setCollapsed] = useState({})

  const [form, setForm] = useState({
    name: '', event_id: '', assigned_to: '', deadline: '', notes: ''
  })

  useEffect(() => {
    Promise.all([
      client.get('/api/tasks'),
      client.get('/api/events'),
      client.get('/api/family-members'),
    ])
      .then(([t, e, f]) => {
        setTasks(t.data)
        setEvents(e.data)
        setFamily(f.data)
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  async function submitTask(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Task name is required')
    try {
      const payload = {
        name: form.name,
        event_id: form.event_id || null,
        assigned_to: form.assigned_to || null,
        deadline: form.deadline || null,
        notes: form.notes || null,
        status: 'pending',
      }
      const res = await client.post('/api/tasks', payload)
      setTasks(prev => [...prev, res.data])
      setForm({ name: '', event_id: '', assigned_to: '', deadline: '', notes: '' })
      setShowForm(false)
      toast.success('Task added!')
    } catch {
      toast.error('Failed to add task')
    }
  }

  async function changeStatus(task) {
    const newStatus = nextStatus(task.status)
    try {
      const res = await client.put(`/api/tasks/${task.id}`, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t))
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function deleteTask(id) {
    try {
      await client.delete(`/api/tasks/${id}`)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const filtered = tasks.filter(t => {
    if (filterEvent && t.event_id !== filterEvent) return false
    if (filterPerson && t.assigned_to !== filterPerson) return false
    return true
  })

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter(t => t.status === s)
    return acc
  }, {})

  const getEvent = id => events.find(e => e.id === id)
  const getAssignee = id => family.find(f => f.id === id)

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FDFBF7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(160deg, #FFF5F0 0%, #FDFBF7 100%)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
            Tasks
          </h1>
          <button
            data-testid="add-task-toggle-btn"
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: showForm ? '#FFF5F0' : '#C05621',
              color: showForm ? '#C05621' : '#FFFFFF',
              border: '1px solid',
              borderColor: '#C05621',
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Task'}
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Add Task Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={submitTask}
                className="rounded-2xl p-5 space-y-4"
                style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
              >
                <h3 className="font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
                  New Task
                </h3>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Task Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter task name"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E2D8D0', color: '#4A3A35' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Event</label>
                    <select
                      value={form.event_id}
                      onChange={e => setForm(f => ({ ...f, event_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
                    >
                      <option value="">Select event</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Assignee</label>
                    <select
                      value={form.assigned_to}
                      onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
                    >
                      <option value="">Unassigned</option>
                      {family.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E2D8D0', color: '#4A3A35' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: '#E2D8D0', color: '#4A3A35' }}
                  />
                </div>
                <button
                  type="submit"
                  data-testid="submit-task-btn"
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #C05621, #9C4215)' }}
                >
                  Add Task
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilterEvent(null)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filterEvent === null ? '#C05621' : '#FFF5F0',
                color: filterEvent === null ? '#FFFFFF' : '#4A3A35',
                border: '1px solid',
                borderColor: filterEvent === null ? '#C05621' : '#E2D8D0',
              }}
            >
              All Events
            </button>
            {events.map(ev => (
              <button
                key={ev.id}
                data-testid={`filter-event-${ev.id}`}
                onClick={() => setFilterEvent(filterEvent === ev.id ? null : ev.id)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: filterEvent === ev.id ? ev.color : ev.color + '15',
                  color: filterEvent === ev.id ? '#FFFFFF' : ev.color,
                  border: '1px solid',
                  borderColor: ev.color,
                }}
              >
                {ev.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilterPerson(null)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filterPerson === null ? '#4A3A35' : '#FFF5F0',
                color: filterPerson === null ? '#FFFFFF' : '#4A3A35',
                border: '1px solid',
                borderColor: filterPerson === null ? '#4A3A35' : '#E2D8D0',
              }}
            >
              Everyone
            </button>
            {family.map(m => (
              <button
                key={m.id}
                data-testid={`filter-person-${m.id}`}
                onClick={() => setFilterPerson(filterPerson === m.id ? null : m.id)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: filterPerson === m.id ? '#4A3A35' : '#FFF5F0',
                  color: filterPerson === m.id ? '#FFFFFF' : '#4A3A35',
                  border: '1px solid',
                  borderColor: filterPerson === m.id ? '#4A3A35' : '#E2D8D0',
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Task Groups */}
        {STATUSES.map(status => {
          const statusTasks = grouped[status]
          const isCollapsed = collapsed[status]

          return (
            <div key={status}>
              <button
                onClick={() => setCollapsed(c => ({ ...c, [status]: !c[status] }))}
                className="w-full flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  <span className="font-semibold text-sm" style={{ color: '#4A3A35' }}>
                    {STATUS_LABELS[status]}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status] }}
                  >
                    {statusTasks.length}
                  </span>
                </div>
                {isCollapsed
                  ? <ChevronDown size={16} style={{ color: '#8C7B75' }} />
                  : <ChevronUp size={16} style={{ color: '#8C7B75' }} />}
              </button>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {statusTasks.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: '#8C7B75' }}>
                        No {STATUS_LABELS[status].toLowerCase()} tasks
                      </p>
                    ) : (
                      statusTasks.map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          data-testid={`task-item-${task.id}`}
                          className="rounded-xl p-4"
                          style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" style={{ color: '#4A3A35' }}>{task.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <EventBadge event={getEvent(task.event_id)} />
                                {task.assigned_to && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: '#8C7B75' }}>
                                    <User size={10} />
                                    {getAssignee(task.assigned_to)?.name}
                                  </span>
                                )}
                                {task.deadline && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: '#8C7B75' }}>
                                    <Calendar size={10} />
                                    {format(parseISO(task.deadline), 'dd MMM yyyy')}
                                  </span>
                                )}
                              </div>
                              {task.notes && (
                                <p className="text-xs mt-1.5 flex items-start gap-1" style={{ color: '#8C7B75' }}>
                                  <FileText size={10} className="mt-0.5 flex-shrink-0" />
                                  {task.notes}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                              style={{ color: '#8C7B75' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => changeStatus(task)}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                              style={{
                                background: STATUS_COLORS[nextStatus(task.status)] + '20',
                                color: STATUS_COLORS[nextStatus(task.status)],
                                border: '1px solid',
                                borderColor: STATUS_COLORS[nextStatus(task.status)] + '40',
                              }}
                            >
                              Mark as {STATUS_LABELS[nextStatus(task.status)]}
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
