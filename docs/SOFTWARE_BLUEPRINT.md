# Software Blueprint v0.1 Foundation

## Missione

Aiutare le persone ad allenare capacità cognitive tramite esercizi semplici, misurabili e rispettosi della privacy. Il prodotto non ha finalità diagnostiche o terapeutiche.

## Architettura

- **App shell** (`src/app`, `src/layouts`): routing e navigazione responsive.
- **Pagine** (`src/pages`): Home, Progressi e Profilo.
- **Cognitive Engine** (`src/games`): giochi isolati, con logica testabile separata dalla UI.
- **Storage** (`src/storage`): repository tipizzati su IndexedDB/Dexie; Zustand conserva lo stato applicativo in memoria.
- **Presentazione** (`src/components`, `src/styles`): componenti riutilizzabili e stile mobile-first.
- **PWA** (`vite.config.ts`, `public`): manifest, icone e service worker generato da Vite PWA.

## Decisioni della Foundation

1. **Single-page application statica.** Vite produce file distribuibili senza server applicativo; il router usa la base `/Brain-Training-Suite/` richiesta da GitHub Pages.
2. **Dati locali per impostazione predefinita.** Profilo, preferenze e sessioni restano in IndexedDB sul dispositivo. Non sono presenti analytics, pubblicità o API remote. I dati v0.1 in `localStorage` vengono migrati una volta e poi rimossi.
3. **Logica di gioco separata.** Le regole della Torre di Hanoi sono funzioni pure coperte da test Vitest.
4. **Progressive Web App.** Il service worker viene aggiornato automaticamente; manifest, scope e start URL rispettano il sottopercorso GitHub Pages.
5. **Quality gate prima del deploy.** GitHub Actions pubblica solo dopo installazione riproducibile, lint, test e build riusciti.

## Protezione dei dati

- nessuna raccolta remota o sincronizzazione cloud;
- nessun segreto richiesto dal frontend;
- eliminazione dello storico disponibile dalla pagina Progressi;
- dati limitati a nome visualizzato, livello preferito e risultati di gioco;
- esportazione JSON, importazione validata e cancellazione completa disponibili dalle Impostazioni.

## Limiti noti v0.1

- lo storico non si sincronizza tra dispositivi o browser;
- la cancellazione delle sole sessioni dalla pagina Progressi conserva profilo e preferenze;
- l'app non sostituisce valutazioni professionali;
- GitHub Pages richiede il fallback client-side già gestito dalle rotte interne dell'app, ma un accesso diretto a una rotta profonda può dipendere dal comportamento dell'hosting statico.

## Roadmap

- v0.1: dashboard, profilo, storage, progressi, Torre di Hanoi e PWA;
- v0.2: Torre di Londra e risultati;
- v0.3: memoria e memoria visiva;
- v0.4: Stroop, Trail Making e reazione;
- v0.5: raccomandazioni e statistiche avanzate;
- v1.0: Genesis.
