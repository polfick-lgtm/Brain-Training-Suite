import { Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrainingStore } from '../../storage/useTrainingStore'
import { buildCoachSuggestions } from './coach'

export function CoachPanel() {
  const { profile, sessions, settings } = useTrainingStore()
  if (!settings.coachEnabled) return null
  const suggestions = buildCoachSuggestions(sessions, profile)

  return (
    <section className="section-block" aria-labelledby="coach-title">
      <p className="eyebrow">Coach locale</p>
      <h2 id="coach-title">Tre idee trasparenti per la prossima attività</h2>
      <p className="coach-disclaimer">
        Suggerimenti automatici basati solo sui dati di questo dispositivo,
        senza valore clinico.
      </p>
      <div className="coach-grid">
        {suggestions.map((suggestion) => (
          <Link
            className="coach-card"
            to={suggestion.route}
            key={suggestion.gameId}
          >
            <Lightbulb aria-hidden="true" />
            <span>
              <strong>{suggestion.title}</strong>
              <small>{suggestion.reason}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
