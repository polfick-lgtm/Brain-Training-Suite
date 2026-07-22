import {
  Brain,
  ChartNoAxesCombined,
  Gamepad2,
  Home,
  ListChecks,
  Settings,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { RouteFocusManager } from '../app/RouteFocusManager'
import { AppDataInitializer } from '../app/AppDataInitializer'
import { SessionTimer } from '../app/SessionTimer'
import { useTrainingStore } from '../storage/useTrainingStore'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/giochi', label: 'Giochi', icon: Gamepad2 },
  { to: '/sessioni', label: 'Sessioni', icon: ListChecks },
  { to: '/progressi', label: 'Progressi', icon: ChartNoAxesCombined },
  { to: '/profilo', label: 'Profilo', icon: UserRound },
  { to: '/impostazioni', label: 'Impostazioni', icon: Settings },
]

export function AppLayout() {
  const hydrated = useTrainingStore((state) => state.hydrated)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenuto-principale">
        Vai al contenuto
      </a>
      <RouteFocusManager />
      <AppDataInitializer />
      <SessionTimer />
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
      <main id="contenuto-principale" className="content" tabIndex={-1}>
        {hydrated ? <Outlet /> : <p role="status">Caricamento dati locali…</p>}
      </main>
    </div>
  )
}
