import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  return (
    <aside className="pwa-toast" role="status" aria-live="polite">
      <p>
        {offlineReady
          ? 'L’app è pronta per funzionare offline.'
          : 'È disponibile una nuova versione dell’app.'}
      </p>
      {needRefresh && (
        <button
          className="button primary"
          onClick={() => void updateServiceWorker(true)}
        >
          Aggiorna ora
        </button>
      )}
      <button
        className="button ghost"
        onClick={() => {
          setOfflineReady(false)
          setNeedRefresh(false)
        }}
      >
        Chiudi
      </button>
    </aside>
  )
}
