import { ChangeEvent, useRef, useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { trainingRepository } from '../storage/trainingRepository'
import { useTrainingStore } from '../storage/useTrainingStore'

export function SettingsPage() {
  const settings = useTrainingStore((state) => state.settings)
  const updateSettings = useTrainingStore((state) => state.updateSettings)
  const importData = useTrainingStore((state) => state.importData)
  const deleteAllData = useTrainingStore((state) => state.deleteAllData)
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function downloadExport() {
    const data = await trainingRepository.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `brain-training-suite-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Esportazione completata.')
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await importData(JSON.parse(await file.text()))
      setStatus('Importazione completata. I dati locali sono stati aggiornati.')
    } catch {
      setStatus(
        'Importazione rifiutata: il file non è valido o non è compatibile.',
      )
    } finally {
      event.target.value = ''
    }
  }

  async function confirmFullDeletion() {
    await deleteAllData()
    setConfirmDelete(false)
    setStatus('Tutti i dati locali sono stati cancellati.')
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Personalizzazione</p>
          <h1>Impostazioni</h1>
          <p>Preferenze e dati restano esclusivamente su questo dispositivo.</p>
        </div>
      </header>
      <section className="settings-grid">
        <div className="panel settings-form">
          <h2>Aspetto e accessibilità</h2>
          <label>
            Tema
            <select
              value={settings.theme}
              onChange={(event) =>
                updateSettings({
                  theme: event.target.value as typeof settings.theme,
                })
              }
            >
              <option value="system">Sistema</option>
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
            </select>
          </label>
          <label>
            Dimensione testo
            <select
              value={settings.textScale}
              onChange={(event) =>
                updateSettings({
                  textScale: event.target.value as typeof settings.textScale,
                })
              }
            >
              <option value="normal">Normale</option>
              <option value="large">Grande</option>
              <option value="extra-large">Molto grande</option>
            </select>
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(event) =>
                updateSettings({ reduceMotion: event.target.checked })
              }
            />
            Riduci animazioni
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.sounds}
              onChange={(event) =>
                updateSettings({ sounds: event.target.checked })
              }
            />
            Suoni
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.coachEnabled}
              onChange={(event) =>
                updateSettings({ coachEnabled: event.target.checked })
              }
            />
            Suggerimenti del coach locale
          </label>
        </div>

        <div className="panel data-actions">
          <h2>Dati locali</h2>
          <p>
            Il file esportato contiene profilo, preferenze e risultati.
            Conservalo con cura.
          </p>
          <button
            className="button ghost"
            onClick={() => void downloadExport()}
          >
            <Download size={18} aria-hidden="true" /> Esporta JSON
          </button>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event)}
          />
          <button
            className="button ghost"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={18} aria-hidden="true" /> Importa JSON
          </button>
          {!confirmDelete ? (
            <button
              className="button danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} aria-hidden="true" /> Cancella tutti i dati
            </button>
          ) : (
            <div className="delete-confirmation" role="alert">
              <strong>Questa operazione non può essere annullata.</strong>
              <button
                className="button danger"
                onClick={() => void confirmFullDeletion()}
              >
                Conferma cancellazione completa
              </button>
              <button
                className="button ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Annulla
              </button>
            </div>
          )}
        </div>
      </section>
      <p className="status-message" role="status" aria-live="polite">
        {status}
      </p>
    </>
  )
}
