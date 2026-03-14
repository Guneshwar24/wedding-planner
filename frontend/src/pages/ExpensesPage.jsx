import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EventBadge from '../components/EventBadge'

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [events, setEvents] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [budgetInputs, setBudgetInputs] = useState({})
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', event_id: '', paid_by: '', comment: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [expRes, evRes, memRes] = await Promise.all([
      supabase.from('expenses').select('*, events(*), family_members(*)').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('created_at'),
      supabase.from('family_members').select('*').order('name'),
    ])
    if (expRes.error) toast.error('Failed to load expenses')
    else setExpenses(expRes.data || [])
    if (evRes.error) toast.error('Failed to load events')
    else {
      setEvents(evRes.data || [])
      const inputs = {}
      ;(evRes.data || []).forEach(e => { inputs[e.id] = e.budget })
      setBudgetInputs(inputs)
    }
    if (memRes.error) toast.error('Failed to load family members')
    else setFamilyMembers(memRes.data || [])
    setLoading(false)
  }

  async function submitExpense() {
    if (!newExpense.name.trim()) return toast.error('Expense name is required')
    if (!newExpense.amount || isNaN(Number(newExpense.amount))) return toast.error('Valid amount is required')
    if (!newExpense.event_id) return toast.error('Please select an event')
    if (!newExpense.paid_by) return toast.error('Please select who paid')

    const { error } = await supabase.from('expenses').insert({
      name: newExpense.name.trim(),
      amount: Number(newExpense.amount),
      event_id: newExpense.event_id,
      paid_by: newExpense.paid_by,
      comment: newExpense.comment.trim() || null,
    })
    if (error) return toast.error(error.message)
    toast.success('Expense added!')
    setNewExpense({ name: '', amount: '', event_id: '', paid_by: '', comment: '' })
    setShowAddForm(false)
    fetchData()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Expense deleted')
    fetchData()
  }

  async function saveBudget(eventId) {
    const budget = Number(budgetInputs[eventId] || 0)
    const { error } = await supabase.from('events').update({ budget }).eq('id', eventId)
    if (error) toast.error(error.message)
    else toast.success('Budget saved')
    fetchData()
  }

  // Group expenses by event
  const byEvent = events.map(event => ({
    event,
    items: expenses.filter(e => e.event_id === event.id),
  })).filter(g => g.items.length > 0)

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
      <div className="bg-primary text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="font-heading text-2xl">Shaadi Brain</h1>
          <button
            data-testid="add-expense-toggle-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        <h2 className="font-heading text-2xl text-wtext">Expenses</h2>

        {/* ── Add Expense Form ─────────────────── */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-border p-5 space-y-4">
                <h3 className="font-heading text-lg text-wtext">Add Expense</h3>

                {/* Event pills */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wide mb-2 block">Event</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {events.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setNewExpense(p => ({ ...p, event_id: ev.id }))}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          newExpense.event_id === ev.id
                            ? 'text-white border-transparent'
                            : 'border-border text-wtext bg-white hover:border-primary/50'
                        }`}
                        style={newExpense.event_id === ev.id ? { backgroundColor: ev.color, borderColor: ev.color } : {}}
                      >
                        {ev.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Expense Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g., Venue booking"
                    value={newExpense.name}
                    onChange={e => setNewExpense(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">₹</span>
                    <input
                      className="input-field pl-8"
                      type="number"
                      placeholder="0"
                      value={newExpense.amount}
                      onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Paid By */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wide mb-2 block">Paid By</label>
                  <div className="flex gap-2 flex-wrap">
                    {familyMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setNewExpense(p => ({ ...p, paid_by: m.id }))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          newExpense.paid_by === m.id
                            ? 'bg-primary text-white border-primary'
                            : 'border-border text-wtext bg-white hover:border-primary/50'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Comment (Optional)</label>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Add any notes..."
                    value={newExpense.comment}
                    onChange={e => setNewExpense(p => ({ ...p, comment: e.target.value }))}
                  />
                </div>

                <button data-testid="submit-expense-btn" onClick={submitExpense} className="btn-primary">
                  Add Expense
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Set Event Budgets ─────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-border p-5">
          <h3 className="font-heading text-lg text-wtext mb-4">Set Event Budgets</h3>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                <span className="text-sm font-medium text-wtext w-24 flex-shrink-0">{event.name}</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                  <input
                    className="w-full border border-border rounded-full px-3 pl-7 py-2 text-sm text-wtext bg-paper focus:outline-none focus:border-primary transition-colors"
                    type="number"
                    value={budgetInputs[event.id] ?? 0}
                    onChange={e => setBudgetInputs(p => ({ ...p, [event.id]: e.target.value }))}
                    onBlur={() => saveBudget(event.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Expenses by Event ─────────────────── */}
        <div>
          <h3 className="font-heading text-xl text-wtext mb-3">Expenses by Event</h3>
          {byEvent.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <IndianRupee size={32} className="mx-auto mb-2 opacity-30" />
              <p>No expenses yet. Add your first expense!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {byEvent.map(({ event, items }) => {
                const total = items.reduce((s, e) => s + Number(e.amount), 0)
                return (
                  <EventGroup
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
      </div>
    </div>
  )
}

function EventGroup({ event, items, total, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 pt-4 pb-3"
      >
        <EventBadge event={event} size="md" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{items.length} items</span>
          {collapsed ? <ChevronDown size={16} className="text-muted" /> : <ChevronUp size={16} className="text-muted" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-1 divide-y divide-border/50">
              {items.map(expense => (
                <div
                  key={expense.id}
                  data-testid={`expense-item-${expense.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-wtext text-sm">{expense.name}</p>
                    <p className="text-primary font-bold">{formatINR(expense.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-wtext bg-paper border border-border rounded-full px-3 py-1">
                      {expense.family_members?.name || '—'}
                    </span>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-semibold text-wtext">Event Total</span>
                <span className="font-bold text-wtext">{formatINR(total)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
