import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';
import EventBadge from '../components/EventBadge';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusCard({ label, count, color }) {
  return (
    <div
      className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-1"
      style={{ backgroundColor: color.bg }}
    >
      <span
        className="font-body text-xl font-bold"
        style={{ color: color.text }}
      >
        {count}
      </span>
      <span
        className="font-body text-xs"
        style={{ color: color.text }}
      >
        {label}
      </span>
    </div>
  );
}

function EventBudgetCard({ event, spent }) {
  const budget = Number(event.budget || 0);
  const spentAmt = Number(spent || 0);
  const remaining = Math.max(budget - spentAmt, 0);
  const overBudget = spentAmt > budget;

  const pieData = budget > 0
    ? [
        { name: 'Spent', value: Math.min(spentAmt, budget) },
        { name: 'Remaining', value: overBudget ? 0 : remaining },
      ]
    : [{ name: 'No Budget', value: 1 }];

  const COLORS = overBudget
    ? ['#C05621', '#E2D8D0']
    : ['#D69E2E', '#E2D8D0'];

  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center gap-2"
      style={{ backgroundColor: '#FFF5F0', border: '1px solid #E2D8D0' }}
    >
      <p
        className="font-heading text-sm text-center line-clamp-2"
        style={{ color: '#4A3A35' }}
      >
        {event.name}
      </p>

      <PieChart width={110} height={110}>
        <Pie
          data={pieData}
          cx={50}
          cy={50}
          innerRadius={35}
          outerRadius={50}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          strokeWidth={0}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>

      <div className="w-full space-y-1">
        <div className="flex justify-between font-body text-xs" style={{ color: '#8C7B75' }}>
          <span>Budget</span>
          <span style={{ color: '#4A3A35' }}>{formatINR(budget)}</span>
        </div>
        <div className="flex justify-between font-body text-xs" style={{ color: '#8C7B75' }}>
          <span>Spent</span>
          <span style={{ color: overBudget ? '#C05621' : '#4A3A35' }}>{formatINR(spentAmt)}</span>
        </div>
        <div className="flex justify-between font-body text-xs" style={{ color: '#8C7B75' }}>
          <span>Remaining</span>
          <span style={{ color: '#4A3A35' }}>{formatINR(remaining)}</span>
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState({});   // { event_id: totalAmount }
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('overall'); // 'overall' | 'person'
  const [selectedPerson, setSelectedPerson] = useState(null);

  // ── fetch data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [tasksRes, eventsRes, expensesRes, membersRes] = await Promise.all([
          supabase.from('tasks').select('*, events(*), family_members(*)'),
          supabase.from('events').select('*').order('created_at'),
          supabase.from('expenses').select('event_id, amount'),
          supabase.from('family_members').select('*').order('name'),
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (eventsRes.error) throw eventsRes.error;
        if (expensesRes.error) throw expensesRes.error;
        if (membersRes.error) throw membersRes.error;

        setTasks(tasksRes.data || []);
        setEvents(eventsRes.data || []);
        setFamilyMembers(membersRes.data || []);

        // Group expenses by event_id
        const expMap = {};
        for (const row of expensesRes.data || []) {
          expMap[row.event_id] = (expMap[row.event_id] || 0) + Number(row.amount || 0);
        }
        setExpenses(expMap);
      } catch (err) {
        toast.error('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  // ── derived state ───────────────────────────────────────────────────────────

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const totalTasks = tasks.length;
  const donePercent = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const notDoneTasks = tasks.filter((t) => t.status !== 'done');
  const filteredUpcoming = viewMode === 'person' && selectedPerson
    ? notDoneTasks.filter((t) => t.assigned_to === selectedPerson.id)
    : notDoneTasks;

  const upcomingTasks = [...filteredUpcoming]
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    })
    .slice(0, 5);

  const first4Events = events.slice(0, 4);

  // ── loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FDFBF7' }}
      >
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            style={{ color: '#C05621' }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="font-body text-sm" style={{ color: '#8C7B75' }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-4"
        style={{ backgroundColor: '#C05621' }}
      >
        <h1 className="font-heading text-2xl text-white tracking-wide">Shaadi Brain</h1>
      </header>

      {/* Scrollable Content */}
      <main className="px-4 pt-20 pb-6 max-w-lg mx-auto">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 mb-6"
        >
          <h2 className="font-heading text-2xl" style={{ color: '#4A3A35' }}>
            Namaste, {profile?.name || 'there'}!
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: '#8C7B75' }}>
            Here's what's happening with your wedding.
          </p>
        </motion.div>

        {/* Task Progress */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="rounded-3xl p-6 mb-5"
          style={{ backgroundColor: '#FFF5F0', border: '1px solid #E2D8D0' }}
        >
          <h3 className="font-heading text-lg mb-4 text-center" style={{ color: '#4A3A35' }}>
            Task Progress
          </h3>

          {/* Progress Ring */}
          <div className="flex flex-col items-center mb-5">
            <ProgressRing size={140} percent={donePercent} />
            <p className="font-body text-sm mt-2 font-semibold" style={{ color: '#C05621' }}>
              {donePercent}% Complete
            </p>
          </div>

          {/* Status Cards */}
          <div className="flex gap-3">
            <StatusCard
              label="Pending"
              count={pendingTasks.length}
              color={{ bg: '#FFFBEB', text: '#92400E' }}
            />
            <StatusCard
              label="In Progress"
              count={inProgressTasks.length}
              color={{ bg: '#EFF6FF', text: '#1E40AF' }}
            />
            <StatusCard
              label="Done"
              count={doneTasks.length}
              color={{ bg: '#F0FDF4', text: '#166534' }}
            />
          </div>
        </motion.section>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-2 mb-4"
        >
          {['overall', 'person'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === 'overall') setSelectedPerson(null);
              }}
              className="font-body text-sm px-5 py-2 rounded-full capitalize transition-colors"
              style={{
                backgroundColor: viewMode === mode ? '#C05621' : '#E2D8D0',
                color: viewMode === mode ? '#FFFFFF' : '#4A3A35',
              }}
            >
              {mode === 'overall' ? 'Overall' : 'Person'}
            </button>
          ))}
        </motion.div>

        {/* Person Chips */}
        {viewMode === 'person' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto flex gap-2 mb-4 pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {familyMembers.map((member) => (
              <button
                key={member.id}
                onClick={() =>
                  setSelectedPerson((prev) =>
                    prev?.id === member.id ? null : member
                  )
                }
                className="flex-shrink-0 font-body text-xs px-4 py-2 rounded-full whitespace-nowrap transition-colors"
                style={{
                  backgroundColor:
                    selectedPerson?.id === member.id ? '#D69E2E' : '#FFF5F0',
                  color: selectedPerson?.id === member.id ? '#FFFFFF' : '#4A3A35',
                  border: `1px solid ${selectedPerson?.id === member.id ? '#D69E2E' : '#E2D8D0'}`,
                }}
              >
                {member.name}
              </button>
            ))}
            {familyMembers.length === 0 && (
              <p className="font-body text-xs" style={{ color: '#8C7B75' }}>
                No family members found.
              </p>
            )}
          </motion.div>
        )}

        {/* Upcoming Tasks */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mb-5"
        >
          <h3 className="font-heading text-lg mb-3" style={{ color: '#4A3A35' }}>
            Upcoming Tasks
          </h3>

          {upcomingTasks.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: '#FFF5F0', border: '1px solid #E2D8D0' }}
            >
              <p className="font-body text-sm" style={{ color: '#8C7B75' }}>
                {viewMode === 'person' && selectedPerson
                  ? `No pending tasks for ${selectedPerson.name}.`
                  : 'All tasks are done! 🎉'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-2xl p-3"
                  style={{ backgroundColor: '#FFF5F0', border: '1px solid #E2D8D0' }}
                >
                  {/* Event Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <EventBadge event={task.events} />
                  </div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-body text-sm font-semibold truncate"
                      style={{ color: '#4A3A35' }}
                    >
                      {task.title || task.name || 'Untitled Task'}
                    </p>
                    {task.family_members?.name && (
                      <p className="font-body text-xs mt-0.5" style={{ color: '#8C7B75' }}>
                        Assigned to: {task.family_members.name}
                      </p>
                    )}
                  </div>

                  {/* Deadline */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="font-body text-xs"
                      style={{ color: task.deadline ? '#C05621' : '#8C7B75' }}
                    >
                      {formatDate(task.deadline)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Budget Overview */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <h3 className="font-heading text-lg mb-3" style={{ color: '#4A3A35' }}>
            Budget Overview
          </h3>

          {first4Events.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: '#FFF5F0', border: '1px solid #E2D8D0' }}
            >
              <p className="font-body text-sm" style={{ color: '#8C7B75' }}>
                No events found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {first4Events.map((event) => (
                <EventBudgetCard
                  key={event.id}
                  event={event}
                  spent={expenses[event.id] || 0}
                />
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
