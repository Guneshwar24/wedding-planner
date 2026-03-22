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
  Edit2,
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
const STATUS_ICONS = { pending: Circle, in_progress: Clock, done: CheckCircle2 }

function formatDeadline(raw) {
  if (!raw) return null
  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return raw
}

const emptyForm = { name: '', event_id: '', assigned_to: '', deadline: '', notes: '', subtasks: [] }

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [filterEvent, setFilterEvent] = useState(null)
  const [filterPerson, setFilterPerson] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('add') // 'add' | 'edit'
  const [formData, setFormData] = useState(emptyForm)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({
    pending: false,
    in_progress: false,
    done: true,
  })

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

  async function handleSubmitTask(e) {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error('Task name is required'); return }
    setSubmitting(true)
    const payload = {
      name: formData.name.trim(),
      event_id: formData.event_id || null,
      assigned_to: formData.assigned_to || null,
      deadline: formData.deadline.trim() || null,
      notes: formData.notes.trim() || null,
      subtasks: formData.subtasks.filter(s => s.text.trim()),
    }
    const { error } = formMode === 'add'
      ? await supabase.from('tasks').insert({ ...payload, status: 'pending' })
      : await supabase.from('tasks').update(payload).eq('id', editingTaskId)
    setSubmitting(false)
    if (error) { toast.error(`Failed to ${formMode === 'add' ? 'add' : 'update'} task`); return }
    toast.success(formMode === 'add' ? 'Task added!' : 'Task updated!')
    closeForm()
    loadAll()
  }

  function closeForm() {
    setFormData(emptyForm)
    setShowForm(false)
    setEditingTaskId(null)
    setFormMode('add')
  }

  function openEdit(task) {
    setFormData({
      name: task.name,
      event_id: task.event_id || '',
      assigned_to: task.assigned_to || '',
      deadline: task.deadline || '',
      notes: task.notes || '',
      subtasks: task.subtasks || [],
    })
    setEditingTaskId(task.id)
    setFormMode('edit')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function cycleStatus(taskId, currentStatus) {
    const next = STATUS_NEXT[currentStatus]
    const { error } = await supabase.from('tasks').update({ status: next }).eq('id', taskId)
    if (error) { toast.error('Failed to update status'); return }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t))
  }

  async function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId)
    const updated = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, done: !s.done } : s
    )
    const { error } = await supabase.from('tasks').update({ subtasks: updated }).eq('id', taskId)
    if (error) { toast.error('Failed to update sub-task'); return }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: updated } : t))
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { toast.error('Failed to delete task'); return }
    toast.success('Task deleted')
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function addSubtask() {
    setFormData(p => ({
      ...p,
      subtasks: [...p.subtasks, { id: crypto.randomUUID(), text: '', done: false }],
    }))
  }

  function removeSubtask(idx) {
    setFormData(p => ({ ...p, subtasks: p.subtasks.filter((_, i) => i !== idx) }))
  }

  function updateSubtaskText(idx, text) {
    setFormData(p => ({
      ...p,
      subtasks: p.subtasks.map((s, i) => i === idx ? { ...s, text } : s),
    }))
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
            onClick={() => showForm ? closeForm() : setShowForm(true)}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
            aria-label="Toggle add task form"
          >
            {showForm ? <X size={18} /> : <Plus size={20} />}
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
              style={filterEvent === ev.id ? {} : { borderColor: ev.color + '60', color: ev.color }}
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

        {/* Add / Edit Task Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="task-form"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                <h2 className="font-heading text-lg font-bold text-wtext mb-4">
                  {formMode === 'add' ? 'Add New Task' : 'Edit Task'}
                </h2>
                <form onSubmit={handleSubmitTask} className="space-y-4">
                  {/* Task Name */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Task Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Book photographer"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>

                  {/* Event selector */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Function / Event
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, event_id: '' }))}
                        className={`${pillBase} ${!formData.event_id ? pillActive : pillInactive}`}
                      >
                        None
                      </button>
                      {events.map(ev => (
                        <button
                          type="button"
                          key={ev.id}
                          onClick={() => setFormData(p => ({
                            ...p,
                            event_id: p.event_id === ev.id ? '' : ev.id,
                          }))}
                          className={`${pillBase} ${formData.event_id === ev.id ? pillActive : pillInactive}`}
                          style={formData.event_id === ev.id ? {} : { borderColor: ev.color + '60', color: ev.color }}
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
                        onClick={() => setFormData(p => ({ ...p, assigned_to: '' }))}
                        className={`${pillBase} ${!formData.assigned_to ? pillActive : pillInactive}`}
                      >
                        No One
                      </button>
                      {familyMembers.map(m => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setFormData(p => ({
                            ...p,
                            assigned_to: p.assigned_to === m.id ? '' : m.id,
                          }))}
                          className={`${pillBase} ${formData.assigned_to === m.id ? pillActive : pillInactive}`}
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
                      value={formData.deadline}
                      onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                      placeholder="YYYY-MM-DD or e.g., March 20, 2026"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Any additional details..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                  </div>

                  {/* Sub-tasks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide">
                        Sub-tasks
                      </label>
                      <button
                        type="button"
                        onClick={addSubtask}
                        className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/70 transition-colors"
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    </div>
                    {formData.subtasks.length === 0 ? (
                      <p className="text-xs text-muted italic">No sub-tasks yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.subtasks.map((st, idx) => (
                          <div key={st.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={st.text}
                              onChange={e => updateSubtaskText(idx, e.target.value)}
                              placeholder={`Sub-task ${idx + 1}`}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => removeSubtask(idx)}
                              className="p-1 text-muted hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    data-testid="submit-task-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {submitting
                      ? (formMode === 'add' ? 'Adding…' : 'Saving…')
                      : (formMode === 'add' ? 'Add Task' : 'Save Changes')}
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
                          {items.map(task => {
                            const subtasks = task.subtasks || []
                            const doneSubs = subtasks.filter(s => s.done).length
                            return (
                              <li
                                key={task.id}
                                data-testid={`task-item-${task.id}`}
                                className="px-5 py-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    {/* Event badge */}
                                    {task.events && <EventBadge event={task.events} size="sm" />}

                                    {/* Task name + subtask progress */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p
                                        className={`font-medium text-sm text-wtext leading-snug ${
                                          task.status === 'done' ? 'line-through text-muted' : ''
                                        }`}
                                      >
                                        {task.name}
                                      </p>
                                      {subtasks.length > 0 && (
                                        <span className="text-xs text-muted bg-cream border border-border rounded-full px-1.5 py-0.5 whitespace-nowrap">
                                          {doneSubs}/{subtasks.length} done
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      {task.family_members && (
                                        <span className="flex items-center gap-1 text-xs text-muted">
                                          <User size={11} />
                                          {task.family_members.name}
                                        </span>
                                      )}
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

                                  {/* Edit + Delete */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => openEdit(task)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                      aria-label="Edit task"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                                      aria-label="Delete task"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Notes */}
                                {task.notes && (
                                  <p className="mt-2 text-xs text-muted leading-relaxed border-t border-border pt-2">
                                    {task.notes}
                                  </p>
                                )}

                                {/* Sub-tasks checklist */}
                                {subtasks.length > 0 && (
                                  <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                                    {subtasks.map(st => (
                                      <button
                                        key={st.id}
                                        onClick={() => toggleSubtask(task.id, st.id)}
                                        className="w-full flex items-center gap-2 text-left group"
                                      >
                                        <div
                                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                                            st.done
                                              ? 'bg-green-500 border-green-500'
                                              : 'border-border group-hover:border-primary/50'
                                          }`}
                                        >
                                          {st.done && (
                                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                              <path
                                                d="M1.5 5l2.5 2.5 4.5-4.5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                        <span
                                          className={`text-xs ${st.done ? 'line-through text-muted' : 'text-wtext'}`}
                                        >
                                          {st.text}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </li>
                            )
                          })}
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
