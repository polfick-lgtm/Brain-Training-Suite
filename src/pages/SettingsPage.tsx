import { Accessibility, Database, Palette } from 'lucide-react'

export function SettingsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Personalizzazione</p>
          <h1>Impostazioni</h1>
          <p>
            Preferenze accessibilità e gestione dati arriveranno nella milestone
            BTS-003.
          </p>
        </div>
      </header>
      <section className="settings-preview" aria-label="Funzioni previste">
        <article className="panel">
          <Palette aria-hidden="true" />
          <h2>Tema</h2>
          <p>Chiaro, scuro o sistema.</p>
        </article>
        <article className="panel">
          <Accessibility aria-hidden="true" />
          <h2>Accessibilità</h2>
          <p>Testo, animazioni e suoni.</p>
        </article>
        <article className="panel">
          <Database aria-hidden="true" />
          <h2>Dati locali</h2>
          <p>Esporta, importa o cancella.</p>
        </article>
      </section>
    </>
  )
}
