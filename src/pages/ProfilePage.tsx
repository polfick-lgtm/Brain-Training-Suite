import { FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useTrainingStore } from '../storage/useTrainingStore'

export function ProfilePage() {
  const store = useTrainingStore()
  const [name, setName] = useState(store.profile.displayName)
  const [level, setLevel] = useState(store.profile.preferredLevel)
  const [goal, setGoal] = useState(store.profile.goal)
  const [saved, setSaved] = useState(false)
  function submit(e: FormEvent) {
    e.preventDefault()
    store.setProfile(name.trim(), level, goal)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Preferenze personali</p>
          <h1>Profilo</h1>
          <p>
            I dati restano memorizzati esclusivamente su questo dispositivo.
          </p>
        </div>
      </header>
      <form className="panel profile-form" onSubmit={submit}>
        <label>
          Nome visualizzato
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Inserisci il tuo nome"
          />
        </label>
        <label>
          Obiettivo preferito
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value as typeof goal)}
          >
            <option value="balanced">Equilibrato</option>
            <option value="memory">Memoria</option>
            <option value="attention">Attenzione</option>
            <option value="logic">Logica</option>
            <option value="speed">Velocità</option>
          </select>
        </label>
        <label>
          Livello iniziale consigliato
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          >
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} dischi
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" type="submit">
          Salva profilo
        </button>
        {saved && <span className="success">Profilo salvato.</span>}
      </form>
      <section className="privacy-card">
        <ShieldCheck size={30} />
        <div>
          <strong>Privacy per impostazione predefinita</strong>
          <p>
            Nessun account obbligatorio, nessun tracciamento e nessun dato
            inviato a server esterni.
          </p>
        </div>
      </section>
    </>
  )
}
