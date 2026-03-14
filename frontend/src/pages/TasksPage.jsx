import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  X,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import EventBadge from '../components/EventBadge'

const STATUS_ORDER = ['pending', 'in_progress', 'done']
const STATUS_NEXT = { pending: 'in_progress', in_progress: 'done', done: 'pending' }
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  done: 'bg-green-100 text-green-700 border-green-200',
}
const STATUS_ICONS = {
  pending: Circle,
  in_progress: Clock,
  done: CheckCircle2,
}

function formatDeadline(raw) {
  if (!raw) return null
  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return raw
}

const emptyTask = { name: '', event_id: '', assigned_to: '', deadline: '', notes: '' }

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [filterEvent, setFilterEvent] = useState(null)
  const [filterPerson, setFilterPerson] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({
    pending: false,
    in_progress: false,
    done: true,
  })
  const [newTask, setNewTask] = useState(emptyTask)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: t }, { data: e }, { data: m }] = await Promise.all([
      supabase.from('tasks').select('*, events(*), family_members(*)'),
      supabase.from('events').select('*').order('created_at'),
      supabase.from('family_members').select('*').order('name'),
    ])
    if (t) setTasks(t)
    if (e) setEvents(e)
    if (m) setFamilyMembers(m)
  }

  async function handleAddTask(e) {
    e.preventDefault()
    if (!newTask.name.trim()) {
      toast.error('Task name is required')
      return
    }
    setSubmitting(true)
    const payload = {
      name: newTask.name.trim(),
      event_id: newTask.event_id || null,
      assigned_to: newTask.assigned_to || null,
      deadline: newTask.deadline.trim() || null,
      notes: newTask.notes.trim() || null,
      status: 'pending',
    }
    const { error } = await supabase.from('tasks').insert(payload)
    setSubmitting(false)
    if (error) {
      toast.error('Failed to add task')
      return
    }
    toast.success('Task added!')
    setNewTask(emptyTask)
    setShowAddForm(false)
    loadAll()
  }

  async function cycleStatus(taskId, currentStatus) {
    const next = STATUS_NEXT[currentStatus]
    const { error } = await supabase.from('tasks').update({ status: next }).eq('id', taskId)
    if (error) {
      toast.error('Failed to update status')
      return
    }
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: next } : t)))
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete task')
      return
    }
    toast.success('Task deleted')
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function toggleSection(status) {
    setCollapsedSections(prev => ({ ...prev, [status]: !prev[status] }))
  }

  const filteredTasks = tasks.filter(t => {
    if (filterEvent && t.event_id !== filterEvent) return false
    if (filterPerson && t.assigned_to !== filterPerson) return false
    return true
  })

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(t => t.status === status)
    return acc
  }, {})

  const pillBase =
    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none'
  const pillActive = 'bg-primary text-white border-primary'
  const pillInactive = 'bg-white text-wtext border-border hover:border-primary/50'

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-primary text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-center">
          <span className="font-heading text-xl font-bold tracking-wide">Shaadi Brain</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-28">
        {/* Page title row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-wtext">Tasks</h1>
          <button
            data-testid="add-task-toggle-btn"
            onClick={() => setShowAddForm(v => !v)}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
            aria-label="Toggle add task form"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Filter row 1: Events */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <button
            className={`${pillBase} ${filterEvent === null ? pillActive : pillInactive}`}
            onClick={() => setFilterEvent(null)}
          >
            All Events
          </button>
          {events.map(ev => (
            <button
              key={ev.id}
              data-testid={`filter-event-${ev.id}`}
              className={`${pillBase} ${filterEvent === ev.id ? pillActive : pillInactive}`}
              onClick={() => setFilterEvent(prev => (prev === ev.id ? null : ev.id))}
              style={
                filterEvent === ev.id
                  ? {}
                  : { borderColor: ev.color + '60', color: ev.color }
              }
            >
              {ev.name}
            </button>
          ))}
        </div>

        {/* Filter row 2: People */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
          <button
            className={`${pillBase} ${filterPerson === null ? pillActive : pillInactive}`}
            onClick={() => setFilterPerson(null)}
          >
            All People
          </button>
          {familyMembers.map(m => (
            <button
              key={m.id}
              data-testid={`filter-person-${m.id}`}
              className={`${pillBase} ${filterPerson === m.id ? pillActive : pillInactive}`}
              onClick={() => setFilterPerson(prev => (prev === m.id ? null : m.id))}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                <h2 className="font-heading text-lg font-bold text-wtext mb-4">Add New Task</h2>
                <form onSubmit={handleAddTask} className="space-y-4">
                  {/* Task Name */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Task Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTask.name}
                      onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Book photographer"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>

                  {/* Event selector */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Event
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setNewTask(p => ({ ...p, event_id: '' }))}
                        className={`${pillBase} ${!newTask.event_id ? pillActive : pillInactive}`}
                      >
                        None
                      </button>
                      {events.map(ev => (
                        <button
                          type="button"
                          key={ev.id}
                          onClick={() =>
                            setNewTask(p => ({
                              ...p,
                              event_id: p.event_id === ev.id ? '' : ev.id,
                            }))
                          }
                          className={`${pillBase} ${newTask.event_id === ev.id ? pillActive : pillInactive}`}
                          style={
                            newTask.event_id === ev.id
                              ? {}
                              : { borderColor: ev.color + '60', color: ev.color }
                          }
                        >
                          {ev.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Assigned To
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setNewTask(p => ({ ...p, assigned_to: '' }))}
                        className={`${pillBase} ${!newTask.assigned_to ? pillActive : pillInactive}`}
                      >
                        No One
                      </button>
                      {familyMembers.map(m => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() =>
                            setNewTask(p => ({
                              ...p,
                              assigned_to: p.assigned_to === m.id ? '' : m.id,
                            }))
                          }
                          className={`${pillBase} ${newTask.assigned_to === m.id ? pillActive : pillInactive}`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Deadline
                    </label>
                    <input
                      type="text"
                      value={newTask.deadline}
                      onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))}
                      placeholder="YYYY-MM-DD or e.g., March 20, 2026"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newTask.notes}
                      onChange={e => setNewTask(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Any additional details..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    data-testid="submit-task-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Adding…' : 'Add Task'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task groups */}
        <div className="space-y-5">
          {STATUS_ORDER.map(status => {
            const items = grouped[status]
            const isCollapsed = collapsedSections[status]
            const Icon = STATUS_ICONS[status]

            return (
              <div key={status} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleSection(status)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-cream/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={16}
                      className={
                        status === 'pending'
                          ? 'text-amber-500'
                          : status === 'in_progress'
                          ? 'text-blue-500'
                          : 'text-green-500'
                      }
                    />
                    <span className="font-heading font-bold text-wtext text-sm">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-muted font-semibold bg-cream px-2 py-0.5 rounded-full border border-border">
                      {items.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-muted" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key="tasks"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {items.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-muted italic">
                          No {STATUS_LABELS[status].toLowerCase()} tasks
                          {filterEvent || filterPerson ? ' matching filters' : ''}.
                        </p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {items.map(task => (
                            <li
                              key={task.id}
                              data-testid={`task-item-${task.id}`}
                              className="px-5 py-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  {/* Event badge */}
                                  {task.events && (
                                    <EventBadge event={task.events} size="sm" />
                                  )}

                                  {/* Task name */}
                                  <p
                                    className={`font-medium text-sm text-wtext leading-snug ${
                                      task.status === 'done' ? 'line-through text-muted' : ''
                                    }`}
                                  >
                                    {task.name}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {/* Assignee */}
                                    {task.family_members && (
                                      <span className="flex items-center gap-1 text-xs text-muted">
                                        <User size={11} />
                                        {task.family_members.name}
                                      </span>
                                    )}

                                    {/* Deadline */}
                                    {task.deadline && (
                                      <span className="flex items-center gap-1 text-xs text-muted">
                                        <Calendar size={11} />
                                        {formatDeadline(task.deadline)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Status pill */}
                                  <button
                                    onClick={() => cycleStatus(task.id, task.status)}
                                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all hover:opacity-80 ${STATUS_COLORS[task.status]}`}
                                  >
                                    {STATUS_LABELS[task.status]}
                                  </button>
                                </div>

                                {/* Delete button */}
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                                  aria-label="Delete task"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              {/* Notes */}
                              {task.notes && (
                                <p className="mt-2 text-xs text-muted leading-relaxed border-t border-border pt-2">
                                  {task.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
