import { ArrowRight, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SessionsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Percorsi</p>
          <h1>Sessioni</h1>
          <p>Le sessioni guidate saranno introdotte nella milestone BTS-008.</p>
        </div>
      </header>
      <section className="panel empty-state">
        <ListChecks size={42} aria-hidden="true" />
        <h2>Allenati con un singolo gioco</h2>
        <p>
          Nel frattempo puoi scegliere liberamente un esercizio disponibile dal
          catalogo.
        </p>
        <Link className="button primary" to="/giochi">
          Apri il catalogo <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </>
  )
}
