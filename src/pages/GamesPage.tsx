import { Clock3, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gameCatalog } from '../core/games/catalog'

const categoryNames = {
  logic: 'Logica',
  memory: 'Memoria',
  attention: 'Attenzione',
  speed: 'Velocità',
}

export function GamesPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Catalogo</p>
          <h1>Giochi</h1>
          <p>
            Scegli un esercizio per area cognitiva. I punteggi descrivono solo
            la tua attività.
          </p>
        </div>
      </header>
      <section className="catalog-grid" aria-label="Catalogo giochi">
        {gameCatalog.map((game) => {
          const content = (
            <>
              <span className="catalog-category">
                {categoryNames[game.category]}
              </span>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
              <small>
                <Clock3 size={15} aria-hidden="true" /> Circa{' '}
                {game.estimateMinutes} min
              </small>
              {game.status === 'coming-soon' && (
                <span className="coming-soon">
                  <LockKeyhole size={15} aria-hidden="true" /> In arrivo
                </span>
              )}
            </>
          )
          return game.status === 'available' ? (
            <Link
              className="catalog-card available"
              to={game.route}
              key={game.id}
            >
              {content}
            </Link>
          ) : (
            <article
              className="catalog-card"
              key={game.id}
              aria-disabled="true"
            >
              {content}
            </article>
          )
        })}
      </section>
    </>
  )
}
