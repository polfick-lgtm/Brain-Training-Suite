import {
  ArrowRight,
  Brain,
  LockKeyhole,
  Puzzle,
  Target,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '../components/StatCard'
import { useTrainingStore } from '../storage/useTrainingStore'
import { CoachPanel } from '../features/coach/CoachPanel'

export function HomePage() {
  const { profile, sessions } = useTrainingStore()
  const totalSeconds = sessions.reduce(
    (sum, session) => sum + session.durationSeconds,
    0,
  )
  const efficiency = sessions.length
    ? Math.round(
        sessions.reduce((sum, session) => sum + session.score, 0) /
          sessions.length,
      )
    : null
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Allenamento cognitivo</p>
          <h1>
            Bentornato{profile.displayName ? `, ${profile.displayName}` : ''}
          </h1>
          <p>Ogni miglioramento inizia con un piccolo allenamento.</p>
        </div>
      </header>
      <section className="hero-card">
        <div>
          <span className="badge">Sessione consigliata</span>
          <h2>Allena logica e pianificazione</h2>
          <p>
            Completa una partita alla Torre di Hanoi e confronta le tue mosse
            con il minimo teorico.
          </p>
          <Link className="button primary" to="/giochi/hanoi">
            Inizia allenamento <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-icon">
          <Brain size={80} />
        </div>
      </section>
      <section className="summary-grid">
        <StatCard
          label="Sessioni totali"
          value={sessions.length}
          detail="allenamenti completati"
        />
        <StatCard
          label="Tempo totale"
          value={`${Math.round(totalSeconds / 60)} min`}
          detail="dedicato alla mente"
        />
        <StatCard
          label="Efficienza media"
          value={efficiency ? `${efficiency}%` : '—'}
          detail="rispetto al minimo"
        />
        <StatCard
          label="Giochi disponibili"
          value="1"
          detail="nuovi moduli in arrivo"
        />
      </section>
      <section className="section-block">
        <p className="eyebrow">Esercizi</p>
        <h2>Scegli il tuo allenamento</h2>
        <div className="game-grid">
          <Link className="game-card available" to="/giochi/hanoi">
            <Target />
            <span>
              <strong>Torre di Hanoi</strong>
              <small>Logica e pianificazione</small>
            </span>
            <ArrowRight />
          </Link>
          <div className="game-card locked">
            <Puzzle />
            <span>
              <strong>Torre di Londra</strong>
              <small>Pianificazione sequenziale</small>
            </span>
            <LockKeyhole />
          </div>
          <div className="game-card locked">
            <Brain />
            <span>
              <strong>Memoria visiva</strong>
              <small>Ricordo di forme e posizioni</small>
            </span>
            <LockKeyhole />
          </div>
          <div className="game-card locked">
            <Zap />
            <span>
              <strong>Tempi di reazione</strong>
              <small>Rapidità e precisione</small>
            </span>
            <LockKeyhole />
          </div>
        </div>
      </section>
      <CoachPanel />
    </>
  )
}
