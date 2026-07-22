# Brain Training Suite

Brain Training Suite è una PWA mobile-first per esercizi cognitivi semplici e misurabili. La versione **v0.1 Foundation** include dashboard, profilo locale, storico dei progressi e Torre di Hanoi.

## Caratteristiche

- navigazione responsive tra Home, Progressi, Profilo e giochi;
- Torre di Hanoi da 3 a 10 dischi;
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

## Verifiche

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

Il comando `npm run verify` esegue in sequenza formato, lint, typecheck e test con copertura.

## Pubblicazione

Ogni push su `main` avvia GitHub Actions, esegue lint, test e build, quindi pubblica `dist` con le GitHub Pages Actions ufficiali. Le pull request eseguono la fase di qualità senza deploy.

URL previsto: `https://polfick-lgtm.github.io/Brain-Training-Suite/`

## Architettura e collaborazione

- [Software Blueprint](docs/SOFTWARE_BLUEPRINT.md)
- [Guida per contribuire](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

Licenza non ancora definita: prima di riutilizzare o distribuire il codice fuori dal repository, contattare il proprietario.
