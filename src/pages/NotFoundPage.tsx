import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="panel empty-state not-found">
      <p className="eyebrow">Errore 404</p>
      <h1>Pagina non trovata</h1>
      <p>La pagina richiesta non esiste oppure è stata spostata.</p>
      <Link className="button primary" to="/">
        Torna alla Home
      </Link>
    </section>
  )
}
