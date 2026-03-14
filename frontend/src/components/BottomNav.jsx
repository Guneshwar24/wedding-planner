import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, DollarSign, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home', testId: 'nav-home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', testId: 'nav-tasks' },
  { to: '/expenses', icon: DollarSign, label: 'Expenses', testId: 'nav-expenses' },
  { to: '/settings', icon: Settings, label: 'Settings', testId: 'nav-settings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            data-testid={testId}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-wtext'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
