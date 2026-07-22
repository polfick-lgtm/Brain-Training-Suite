# Software Blueprint v1.0 Genesis

## Missione

Aiutare le persone ad allenare capacità cognitive tramite esercizi semplici, misurabili e rispettosi della privacy. Il prodotto non ha finalità diagnostiche o terapeutiche.

## Architettura

- **App shell** (`src/app`, `src/layouts`): routing e navigazione responsive.
- **Pagine** (`src/pages`): Home, catalogo giochi, sessioni, progressi, profilo e impostazioni.
- **Cognitive Engine** (`src/games`): giochi isolati, con logica testabile separata dalla UI.
- **Sessioni e coach** (`src/features`): pianificazione deterministica e suggerimenti spiegabili basati esclusivamente sui risultati locali.
- **Storage** (`src/storage`): repository tipizzati su IndexedDB/Dexie; Zustand conserva lo stato applicativo in memoria.
- **Presentazione** (`src/components`, `src/styles`): componenti riutilizzabili e stile mobile-first.
- **PWA** (`vite.config.ts`, `public`): manifest, icone e service worker generato da Vite PWA.

## Decisioni architetturali

1. **Single-page application statica.** Vite produce file distribuibili senza server applicativo; il router usa la base `/Brain-Training-Suite/` richiesta da GitHub Pages.
2. **Dati locali per impostazione predefinita.** Profilo, preferenze e sessioni restano in IndexedDB sul dispositivo. Non sono presenti analytics, pubblicità o API remote. I dati v0.1 in `localStorage` vengono migrati una volta e poi rimossi.
3. **Contratto comune dei giochi.** Metadati, difficoltà e risultati seguono tipi condivisi; gli engine mantengono la logica testabile separata dalla UI.
4. **Progressive Web App.** Il service worker segnala quando l'app è pronta offline o quando è disponibile un aggiornamento; manifest, scope e start URL rispettano il sottopercorso GitHub Pages. Un fallback `404.html` ripristina le route profonde sull'hosting statico.
5. **Quality gate prima del deploy.** GitHub Actions pubblica solo dopo installazione riproducibile, formato, lint, typecheck, test con copertura, build, test browser e prova PWA offline.
6. **Coach deterministico e non medico.** Le raccomandazioni sono generate sul dispositivo da regole verificabili, mostrano la motivazione e possono essere disattivate.

## Protezione dei dati

- nessuna raccolta remota o sincronizzazione cloud;
- nessun segreto richiesto dal frontend;
- eliminazione dello storico disponibile dalla pagina Progressi;
- dati limitati a nome visualizzato, livello preferito e risultati di gioco;
- esportazione JSON, importazione validata e cancellazione completa disponibili dalle Impostazioni.

## Limiti noti v1.0

- la cancellazione delle sole sessioni dalla pagina Progressi conserva profilo e preferenze;
- l'app non sostituisce valutazioni professionali;
- profilo e cronologia non si sincronizzano tra dispositivi;
- i risultati sono indicativi e non hanno finalità diagnostiche o terapeutiche;
- l'installazione dipende dal supporto PWA del browser e del sistema operativo.

## Evoluzione successiva

Le estensioni future dovranno preservare il contratto comune dei giochi, il funzionamento offline, l'accessibilità e l'assenza di raccolta dati. Qualsiasi sincronizzazione resterà opt-in e richiederà una decisione architetturale dedicata.
