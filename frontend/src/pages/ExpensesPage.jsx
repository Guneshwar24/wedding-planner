import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronDown, ChevronUp, Trash2, Edit2, Check } from 'lucide-react'
import { toast } from 'sonner'
import client from '../api/client'
import BottomNav from '../components/BottomNav'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [events, setEvents] = useState([])
  const [family, setFamily] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterEvent, setFilterEvent] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [editingBudget, setEditingBudget] = useState({})
  const [budgetValues, setBudgetValues] = useState({})

  const [form, setForm] = useState({
    event_id: '', name: '', amount: '', paid_by: '', comment: ''
  })

  useEffect(() => {
    Promise.all([
      client.get('/api/expenses'),
      client.get('/api/events'),
      client.get('/api/family'),
    ])
      .then(([ex, ev, fam]) => {
        setExpenses(ex.data)
        setEvents(ev.data)
        setFamily(fam.data)
        const budgets = {}
        ev.data.forEach(e => { budgets[e.id] = e.budget || 0 })
        setBudgetValues(budgets)
      })
      .catch(() => toast.error('Failed to load expenses'))
      .finally(() => setLoading(false))
  }, [])

  async function submitExpense(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.amount) return toast.error('Name and amount are required')
    try {
      const payload = {
        event_id: form.event_id || null,
        name: form.name,
        amount: parseFloat(form.amount),
        paid_by: form.paid_by || null,
        comment: form.comment || null,
      }
      const res = await client.post('/api/expenses', payload)
      setExpenses(prev => [...prev, res.data])
      setForm({ event_id: '', name: '', amount: '', paid_by: '', comment: '' })
      setShowForm(false)
      toast.success('Expense added!')
    } catch {
      toast.error('Failed to add expense')
    }
  }

  async function deleteExpense(id) {
    try {
      await client.delete(`/api/expenses/${id}`)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  async function saveBudget(eventId) {
    try {
      const res = await client.patch(`/api/events/${eventId}/budget`, {
        budget: parseFloat(budgetValues[eventId]) || 0
      })
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, budget: res.data.budget } : e))
      setEditingBudget(prev => ({ ...prev, [eventId]: false }))
      toast.success('Budget updated!')
    } catch {
      toast.error('Failed to update budget')
    }
  }

  const filteredEvents = filterEvent
    ? events.filter(e => e.id === filterEvent)
    : events

  const getMemberName = id => family.find(f => f.id === id)?.name || id

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
            Expenses
          </h1>
          <button
            data-testid="add-expense-toggle-btn"
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: showForm ? '#FFF5F0' : '#C05621',
              color: showForm ? '#C05621' : '#FFFFFF',
              border: '1px solid #C05621',
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Add Expense Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={submitExpense}
                className="rounded-2xl p-5 space-y-4"
                style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
              >
                <h3 className="font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}>
                  New Expense
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Event</label>
                    <select
                      value={form.event_id}
                      onChange={e => setForm(f => ({ ...f, event_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
                    >
                      <option value="">General</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Paid By</label>
                    <select
                      value={form.paid_by}
                      onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E2D8D0', color: '#4A3A35', background: '#FFFFFF' }}
                    >
                      <option value="">Select person</option>
                      {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Expense Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Catering deposit"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E2D8D0', color: '#4A3A35' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#8C7B75' }}>₹</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E2D8D0', color: '#4A3A35' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#4A3A35' }}>Comment</label>
                  <input
                    type="text"
                    value={form.comment}
                    onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Optional note"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E2D8D0', color: '#4A3A35' }}
                  />
                </div>
                <button
                  type="submit"
                  data-testid="submit-expense-btn"
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #C05621, #9C4215)' }}
                >
                  Add Expense
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterEvent(null)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
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
              onClick={() => setFilterEvent(filterEvent === ev.id ? null : ev.id)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
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

        {/* Expenses grouped by event */}
        {filteredEvents.map(event => {
          const eventExpenses = expenses.filter(e => e.event_id === event.id)
          const spent = eventExpenses.reduce((s, e) => s + (e.amount || 0), 0)
          const budget = event.budget || 0
          const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
          const isCollapsed = collapsed[event.id]
          const isEditing = editingBudget[event.id]

          return (
            <div key={event.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2D8D0', background: '#FFFFFF' }}>
              {/* Event Header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: event.color + '10', borderBottom: '1px solid #E2D8D0' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: event.color }} />
                  <span className="font-semibold text-sm" style={{ color: '#4A3A35' }}>{event.name}</span>
                  <span className="text-xs" style={{ color: '#8C7B75' }}>({eventExpenses.length})</span>
                </div>
                <button onClick={() => setCollapsed(c => ({ ...c, [event.id]: !c[event.id] }))}>
                  {isCollapsed
                    ? <ChevronDown size={16} style={{ color: '#8C7B75' }} />
                    : <ChevronUp size={16} style={{ color: '#8C7B75' }} />}
                </button>
              </div>

              {/* Budget Bar */}
              <div className="px-4 py-3 border-b" style={{ borderColor: '#E2D8D0' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium" style={{ color: '#4A3A35' }}>
                      ₹{spent.toLocaleString('en-IN')} spent
                    </span>
                    <span className="text-xs" style={{ color: '#8C7B75' }}>of</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={budgetValues[event.id] || ''}
                        onChange={e => setBudgetValues(prev => ({ ...prev, [event.id]: e.target.value }))}
                        className="w-24 px-2 py-0.5 rounded-lg border text-xs outline-none"
                        style={{ borderColor: '#C05621', color: '#4A3A35' }}
                      />
                    ) : (
                      <span className="text-xs font-medium" style={{ color: '#4A3A35' }}>
                        ₹{budget.toLocaleString('en-IN')} budget
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <button
                      data-testid="save-budget-btn"
                      onClick={() => saveBudget(event.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ background: '#38A16920', color: '#38A169' }}
                    >
                      <Check size={12} /> Save
                    </button>
                  ) : (
                    <button
                      data-testid="edit-budget-btn"
                      onClick={() => setEditingBudget(prev => ({ ...prev, [event.id]: true }))}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ background: '#C0562120', color: '#C05621' }}
                    >
                      <Edit2 size={12} /> Edit Budget
                    </button>
                  )}
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: '#E2D8D0' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      background: percent > 90 ? '#E53E3E' : percent > 70 ? '#D69E2E' : event.color,
                    }}
                  />
                </div>
                <p className="text-xs mt-1 text-right" style={{ color: '#8C7B75' }}>{percent}% used</p>
              </div>

              {/* Expense List */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {eventExpenses.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: '#8C7B75' }}>
                        No expenses yet
                      </p>
                    ) : (
                      eventExpenses.map(expense => (
                        <div
                          key={expense.id}
                          data-testid={`expense-item-${expense.id}`}
                          className="flex items-center gap-3 px-4 py-3 border-t"
                          style={{ borderColor: '#E2D8D0' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: '#4A3A35' }}>{expense.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {expense.paid_by && (
                                <span className="text-xs" style={{ color: '#8C7B75' }}>
                                  by {getMemberName(expense.paid_by)}
                                </span>
                              )}
                              {expense.comment && (
                                <span className="text-xs" style={{ color: '#8C7B75' }}>· {expense.comment}</span>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-sm flex-shrink-0" style={{ color: '#4A3A35' }}>
                            ₹{(expense.amount || 0).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-1.5 rounded-lg flex-shrink-0"
                            style={{ color: '#8C7B75' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {/* Unassigned expenses */}
        {!filterEvent && (() => {
          const unassigned = expenses.filter(e => !e.event_id)
          if (unassigned.length === 0) return null
          const isCollapsed = collapsed['unassigned']
          return (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2D8D0', background: '#FFFFFF' }}>
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid #E2D8D0', background: '#F9F5F0' }}
              >
                <span className="font-semibold text-sm" style={{ color: '#4A3A35' }}>
                  General ({unassigned.length})
                </span>
                <button onClick={() => setCollapsed(c => ({ ...c, unassigned: !c.unassigned }))}>
                  {isCollapsed
                    ? <ChevronDown size={16} style={{ color: '#8C7B75' }} />
                    : <ChevronUp size={16} style={{ color: '#8C7B75' }} />}
                </button>
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {unassigned.map(expense => (
                      <div
                        key={expense.id}
                        data-testid={`expense-item-${expense.id}`}
                        className="flex items-center gap-3 px-4 py-3 border-t"
                        style={{ borderColor: '#E2D8D0' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: '#4A3A35' }}>{expense.name}</p>
                          {expense.paid_by && (
                            <span className="text-xs" style={{ color: '#8C7B75' }}>by {getMemberName(expense.paid_by)}</span>
                          )}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: '#4A3A35' }}>
                          ₹{(expense.amount || 0).toLocaleString('en-IN')}
                        </span>
                        <button onClick={() => deleteExpense(expense.id)} className="p-1.5 rounded-lg" style={{ color: '#8C7B75' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })()}
      </div>

      <BottomNav />
    </div>
  )
}
