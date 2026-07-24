# Brain Training Suite

Brain Training Suite è una PWA mobile-first e privacy-first per esercizi cognitivi semplici e misurabili. La versione **v1.0 Genesis** offre dieci giochi, sessioni guidate, progressi accessibili e un coach interamente locale.

## Caratteristiche

- navigazione responsive tra Home, Giochi, Sessioni, Progressi, Profilo e Impostazioni;
- Torre di Hanoi e Torre di Londra, quattro esercizi di memoria e quattro di attenzione;
- session builder per obiettivo e durata, con pausa e avanzamento automatico;
- statistiche filtrabili, grafico con tabella equivalente e coach locale trasparente;
- profilo, preferenze e sessioni conservati in IndexedDB tramite Dexie;
- esportazione JSON, importazione validata e cancellazione completa dei dati;
- installazione PWA e funzionamento offline dopo la prima visita;
- nessun account, tracciamento, annuncio o invio di dati personali;
- test unitari con Vitest e smoke test con Playwright.

> Il progetto è destinato all'allenamento e all'intrattenimento. Non offre diagnosi o indicazioni mediche.

## Requisiti e avvio locale

Richiede Node.js 22 e npm.

```bash
npm install
npm run dev
```

Vite mostra nel terminale l'indirizzo locale. In sviluppo l'app è servita sotto `/Brain-Training-Suite/`, come nella pubblicazione GitHub Pages.

## Comandi di qualità

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:pwa
```

Il comando `npm run verify` esegue in sequenza formato, lint, typecheck e test con copertura.

## Privacy e accessibilità

Tutti i dati restano nel browser in IndexedDB. Non esistono account, telemetria, pubblicità o richieste verso servizi applicativi remoti. Da Impostazioni è possibile esportare, importare con validazione o cancellare tutti i dati. I giochi supportano mouse, touch e tastiera; l'interfaccia include gestione del focus, riduzione animazioni, tema e dimensione del testo.

## Pubblicazione

Ogni push su `main` avvia GitHub Actions, esegue lint, test e build, quindi pubblica `dist` con le GitHub Pages Actions ufficiali. Le pull request eseguono la fase di qualità senza deploy.

URL previsto: `https://polfick-lgtm.github.io/Brain-Training-Suite/`

## Architettura e collaborazione

- [Software Blueprint](docs/SOFTWARE_BLUEPRINT.md)
- [Note di rilascio v1.0](docs/RELEASE_V1.md)
- [Stato delle attività](docs/TASKS.md)
- [Guida per contribuire](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

Licenza non ancora definita: prima di riutilizzare o distribuire il codice fuori dal repository, contattare il proprietario.
