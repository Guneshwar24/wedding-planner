import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Trash2, IndianRupee } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EventBadge from '../components/EventBadge'

function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN')
}

const emptyExpense = { name: '', amount: '', event_id: '', paid_by: '', comment: '' }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [events, setEvents] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState(emptyExpense)
  const [budgetInputs, setBudgetInputs] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [expRes, evRes, memRes] = await Promise.all([
      supabase.from('expenses').select('*, events(*), family_members(*)'),
      supabase.from('events').select('*').order('created_at'),
      supabase.from('family_members').select('*').order('name'),
    ])
    if (expRes.error) {
      toast.error('Failed to load expenses')
    } else {
      setExpenses(expRes.data || [])
    }
    if (evRes.error) {
      toast.error('Failed to load events')
    } else {
      const evData = evRes.data || []
      setEvents(evData)
      const inputs = {}
      evData.forEach(e => {
        inputs[e.id] = e.budget ?? 0
      })
      setBudgetInputs(inputs)
    }
    if (memRes.error) {
      toast.error('Failed to load family members')
    } else {
      setFamilyMembers(memRes.data || [])
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    if (!newExpense.name.trim()) {
      toast.error('Expense name is required')
      return
    }
    if (!newExpense.amount || isNaN(Number(newExpense.amount))) {
      toast.error('A valid amount is required')
      return
    }
    if (!newExpense.event_id) {
      toast.error('Please select an event')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('expenses').insert({
      name: newExpense.name.trim(),
      amount: Number(newExpense.amount),
      event_id: newExpense.event_id,
      paid_by: newExpense.paid_by || null,
      comment: newExpense.comment.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      toast.error('Failed to add expense')
      return
    }
    toast.success('Expense added!')
    setNewExpense(emptyExpense)
    setShowAddForm(false)
    fetchData()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete expense')
      return
    }
    toast.success('Expense deleted')
    setExpenses(prev => prev.filter(ex => ex.id !== id))
  }

  async function saveBudget(eventId) {
    const budget = Number(budgetInputs[eventId] || 0)
    const { error } = await supabase.from('events').update({ budget }).eq('id', eventId)
    if (error) {
      toast.error('Failed to save budget')
    } else {
      toast.success('Budget saved')
    }
  }

  const pillBase =
    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none'
  const pillActive = 'bg-primary text-white border-primary'
  const pillInactive = 'bg-white text-wtext border-border hover:border-primary/50'

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-border bg-cream text-wtext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  // Group expenses by event
  const byEvent = events
    .map(event => ({
      event,
      items: expenses.filter(ex => ex.event_id === event.id),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Fixed top header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-primary text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-center">
          <span className="font-heading text-xl font-bold tracking-wide">Shaadi Brain</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-28">
        {/* Page title row */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-heading text-2xl font-bold text-wtext">Expenses</h1>
          <button
            data-testid="add-expense-toggle-btn"
            onClick={() => setShowAddForm(v => !v)}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
            aria-label="Toggle add expense form"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Add Expense Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="add-expense-form"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
                <h2 className="font-heading text-lg font-bold text-wtext mb-4">Add Expense</h2>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  {/* Event pills (required) */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Event <span className="text-primary">*</span>
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {events.map(ev => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() =>
                            setNewExpense(p => ({
                              ...p,
                              event_id: p.event_id === ev.id ? '' : ev.id,
                            }))
                          }
                          className={`${pillBase} ${newExpense.event_id === ev.id ? pillActive : pillInactive}`}
                          style={
                            newExpense.event_id === ev.id
                              ? {}
                              : { borderColor: (ev.color || '#E2D8D0') + '80', color: ev.color }
                          }
                        >
                          {ev.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expense Name */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Expense Name
                    </label>
                    <input
                      type="text"
                      value={newExpense.name}
                      onChange={e => setNewExpense(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Venue booking"
                      className={inputClass}
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={newExpense.amount}
                        onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0"
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>

                  {/* Paid By */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Paid By
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setNewExpense(p => ({ ...p, paid_by: '' }))}
                        className={`${pillBase} ${!newExpense.paid_by ? pillActive : pillInactive}`}
                      >
                        No One
                      </button>
                      {familyMembers.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setNewExpense(p => ({
                              ...p,
                              paid_by: p.paid_by === m.id ? '' : m.id,
                            }))
                          }
                          className={`${pillBase} ${newExpense.paid_by === m.id ? pillActive : pillInactive}`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                      Comment (optional)
                    </label>
                    <textarea
                      value={newExpense.comment}
                      onChange={e => setNewExpense(p => ({ ...p, comment: e.target.value }))}
                      placeholder="Any notes..."
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <button
                    data-testid="submit-expense-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Adding…' : 'Add Expense'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Set Event Budgets */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-5 mb-6">
          <h2 className="font-heading text-lg font-bold text-wtext mb-4">Set Event Budgets</h2>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color || '#C05621' }}
                />
                <span className="text-sm font-medium text-wtext flex-shrink-0 w-28 truncate">
                  {event.name}
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={budgetInputs[event.id] ?? 0}
                    onChange={e =>
                      setBudgetInputs(prev => ({ ...prev, [event.id]: e.target.value }))
                    }
                    onBlur={() => saveBudget(event.id)}
                    className="w-full border border-border rounded-lg px-3 pl-7 py-2 text-sm text-wtext bg-cream focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted italic">No events found.</p>
            )}
          </div>
        </div>

        {/* Expenses by Event */}
        <div>
          <h2 className="font-heading text-xl font-bold text-wtext mb-4">Expenses by Event</h2>
          {byEvent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
              <IndianRupee size={36} className="mb-3 opacity-30" />
              <p className="text-sm italic">No expenses yet. Add your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {byEvent.map(({ event, items }) => {
                const total = items.reduce((sum, ex) => sum + Number(ex.amount || 0), 0)
                return (
                  <EventExpenseGroup
                    key={event.id}
                    event={event}
                    items={items}
                    total={total}
                    onDelete={deleteExpense}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function EventExpenseGroup({ event, items, total, onDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Group header */}
      <div className="px-5 py-3.5 border-b border-border">
        <EventBadge event={event} size="md" />
      </div>

      {/* Expense rows */}
      <ul className="divide-y divide-border">
        {items.map(expense => (
          <li
            key={expense.id}
            data-testid={`expense-item-${expense.id}`}
            className="flex items-center justify-between px-5 py-3 gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-wtext truncate">{expense.name}</p>
              <p className="text-sm font-bold text-primary mt-0.5">
                {formatINR(expense.amount)}
              </p>
              {expense.comment && (
                <p className="text-xs text-muted mt-0.5 truncate">{expense.comment}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {expense.family_members && (
                <span className="text-xs font-medium text-wtext bg-cream border border-border rounded-full px-2.5 py-1">
                  {expense.family_members.name}
                </span>
              )}
              <button
                onClick={() => onDelete(expense.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete expense"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Event Total row */}
      <div className="flex items-center justify-between px-5 py-3 bg-cream/60 border-t border-border">
        <span className="text-sm font-semibold text-wtext">Event Total</span>
        <span className="text-sm font-bold text-wtext">{formatINR(total)}</span>
      </div>
    </div>
  )
}
