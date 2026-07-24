# Brain Training Suite v1.0 Genesis

## Contenuto del rilascio

La prima versione completa riunisce dieci giochi, sessioni guidate, statistiche locali, coach trasparente, profilo e preferenze in una PWA installabile. L'app è progettata per mouse, tastiera e touch e mantiene i dati esclusivamente sul dispositivo.

## Verifica di rilascio

- formato, ESLint e TypeScript;
- 50 test unitari con copertura;
- build di produzione e generazione del service worker;
- 20 scenari Playwright su navigazione, giochi, persistenza, sessioni, responsive e route dirette;
- prova PWA installata e riaperta offline;
- audit delle dipendenze npm.

La verifica manuale copre inoltre tutti i percorsi, i controlli di gioco,
profilo, preferenze, esportazione/importazione, cancellazione dati, Session
Builder, filtri statistiche e viewport da 320 px a tablet.

## Aggiornamento da v0.1

I dati compatibili presenti nel vecchio storage locale vengono migrati automaticamente in IndexedDB. Prima dell'aggiornamento è comunque possibile esportare una copia JSON dalle Impostazioni.

## Limiti noti

- nessuna sincronizzazione tra dispositivi o browser;
- disponibilità del comando di installazione variabile in base al browser;
- nessuna finalità medica, diagnostica o terapeutica.

## Distribuzione

Il workflow GitHub Actions verifica ogni pull request. Dopo l'integrazione in `main`, pubblica `dist` su GitHub Pages con le Actions ufficiali e base path `/Brain-Training-Suite/`.
