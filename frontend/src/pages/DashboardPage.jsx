import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import client from '../api/client'
import { toast } from 'sonner'
import { Calendar, User } from 'lucide-react'

function CircularProgress({ percent, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E2D8D0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#38A169"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function EventBudgetCard({ event, expenses }) {
  const eventExpenses = expenses.filter(e => e.event_id === event.id)
  const spent = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const budget = event.budget || 0
  const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0

  const data = [
    { value: percent },
    { value: 100 - percent },
  ]

  const color = event.color || '#C05621'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-sm font-semibold truncate" style={{ color: '#4A3A35' }}>
          {event.name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div style={{ width: 60, height: 60 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={18}
                outerRadius={28}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={color} />
                <Cell fill="#E2D8D0" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold" style={{ color: '#4A3A35' }}>
            {percent}%
          </p>
          <p className="text-xs" style={{ color: '#8C7B75' }}>
            ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [family, setFamily] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState(null)

  useEffect(() => {
    Promise.all([
      client.get('/api/tasks'),
      client.get('/api/events'),
      client.get('/api/family-members'),
      client.get('/api/expenses'),
    ])
      .then(([tasksRes, eventsRes, familyRes, expensesRes]) => {
        setTasks(tasksRes.data)
        setEvents(eventsRes.data)
        setFamily(familyRes.data)
        setExpenses(expensesRes.data)
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  const filteredTasks = selectedPerson
    ? tasks.filter(t => t.assigned_to === selectedPerson)
    : tasks

  const pending = filteredTasks.filter(t => t.status === 'pending').length
  const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length
  const done = filteredTasks.filter(t => t.status === 'done').length
  const total = filteredTasks.length
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0

  const upcoming = [...filteredTasks]
    .filter(t => t.status !== 'done' && t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  const getEventName = (id) => events.find(e => e.id === id)?.name || 'Unknown'
  const getEventColor = (id) => events.find(e => e.id === id)?.color || '#C05621'
  const getAssigneeName = (id) => family.find(f => f.id === id)?.name || 'Unassigned'

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
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(160deg, #FFF5F0 0%, #FDFBF7 100%)' }}
      >
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-medium mb-1" style={{ color: '#8C7B75' }}>
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}
          >
            Namaste, {user?.name?.split(' ')[0] || 'Friend'}! 🙏
          </h1>
        </motion.div>
      </div>

      <div className="px-5 space-y-6">
        {/* Progress Ring + Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
        >
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <CircularProgress percent={donePercent} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: '#38A169' }}>
                  {donePercent}%
                </span>
                <span className="text-xs" style={{ color: '#8C7B75' }}>done</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              {[
                { label: 'Pending', count: pending, color: '#D69E2E' },
                { label: 'In Progress', count: inProgress, color: '#C05621' },
                { label: 'Done', count: done, color: '#38A169' },
              ].map(({ label, count, color }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold" style={{ color }}>{count}</p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: '#8C7B75' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Person Filter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8C7B75' }}>
            View by Person
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedPerson(null)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: selectedPerson === null ? '#C05621' : '#FFF5F0',
                color: selectedPerson === null ? '#FFFFFF' : '#4A3A35',
                border: '1px solid',
                borderColor: selectedPerson === null ? '#C05621' : '#E2D8D0',
              }}
            >
              Overall
            </button>
            {family.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedPerson(member.id === selectedPerson ? null : member.id)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: selectedPerson === member.id ? '#C05621' : '#FFF5F0',
                  color: selectedPerson === member.id ? '#FFFFFF' : '#4A3A35',
                  border: '1px solid',
                  borderColor: selectedPerson === member.id ? '#C05621' : '#E2D8D0',
                }}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        {upcoming.length > 0 && (
          <div>
            <h2
              className="text-lg font-semibold mb-3"
              style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}
            >
              Upcoming Tasks
            </h2>
            <div className="space-y-2">
              {upcoming.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl p-3.5"
                  style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: getEventColor(task.event_id) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#4A3A35' }}>
                      {task.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: getEventColor(task.event_id) + '20', color: getEventColor(task.event_id) }}
                      >
                        {getEventName(task.event_id)}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#8C7B75' }}>
                        <User size={10} />
                        {getAssigneeName(task.assigned_to)}
                      </span>
                    </div>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: '#8C7B75' }}>
                      <Calendar size={12} />
                      {format(parseISO(task.deadline), 'dd MMM')}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Overview */}
        {events.length > 0 && (
          <div>
            <h2
              className="text-lg font-semibold mb-3"
              style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}
            >
              Budget Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {events.map(event => (
                <EventBudgetCard key={event.id} event={event} expenses={expenses} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
