import { Link, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Wallet, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home', testId: 'nav-home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', testId: 'nav-tasks' },
  { to: '/expenses', icon: Wallet, label: 'Expenses', testId: 'nav-expenses' },
  { to: '/settings', icon: Settings, label: 'Settings', testId: 'nav-settings' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(253, 251, 247, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #E2D8D0',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, testId }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              data-testid={testId}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200"
              style={{ color: active ? '#C05621' : '#8C7B75' }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
