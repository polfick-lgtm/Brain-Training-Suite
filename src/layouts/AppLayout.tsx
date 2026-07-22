import { Brain, ChartNoAxesCombined, Home, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/progressi', label: 'Progressi', icon: ChartNoAxesCombined },
  { to: '/profilo', label: 'Profilo', icon: UserRound },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <Brain size={30} />
          <span>
            <strong>Brain Training</strong>
            <small>Suite</small>
          </span>
        </NavLink>
        <nav>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="version">v0.1 Foundation</div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
