# Brain Training Suite

Brain Training Suite è una PWA mobile-first e privacy-first per esercizi cognitivi e giochi originali. La versione **v1.1 Arcade** offre dieci allenamenti, otto Arcade, sessioni guidate, progressi accessibili e un coach interamente locale.

## Caratteristiche

Memory offre carte da girare, Simon sequenze luminose e Torre di Londra
palline da spostare tra aste.
I tre giochi offrono difficoltà, pausa, riavvio, risultato e salvataggio locale.
Le interazioni usano pulsanti accessibili a tastiera e touch; simboli e numeri
rendono le tavole leggibili anche senza distinguere i colori.

## Arcade

- Snake: raccogli stelle evitando muri e coda;
- Spacca mattoni: racchetta, pallina, tre vite e una parete da ripulire;
- Labirinto arcade: labirinti connessi, chiavi e uscita;
- Blocchi cadenti: sette forme ruotabili, righe e punti;
- Space Shooter: movimento, sparo e bersagli da abbattere;
- Asteroidi: rotazione, motore, rocce divisibili e spazio avvolgente;
- Sokoban: casse, obiettivi e annullamento delle mosse;
- Puzzle 15: tessere numerate e configurazioni sempre solvibili.

Gli Arcade hanno grafica originale e non richiedono emulatori o ROM. I risultati
e i record per difficoltà restano locali. Il Coach e il Session Builder
continuano a proporre i soli allenamenti. I giochi d'azione hanno tre vite e un
limite di 180 secondi; tutte le tavole supportano pausa e riavvio. I punteggi su
100 indicano il progresso verso l'obiettivo, mentre i punti Arcade e le mosse
sono conservati nei dettagli e usati per i record.

Per aprire il catalogo con un collegamento compatibile con l'hosting statico:
`https://polfick-lgtm.github.io/Brain-Training-Suite/?p=%2Fgiochi`.

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

Queste condizioni riguardano la Brain Training Suite principale. Luma usa invece profili e progressi sul backend del server, con approvazione dall’area amministrativa e senza invio di email.

## Pubblicazione

Ogni push su `main` avvia GitHub Actions, esegue lint, test e build, quindi pubblica `dist` con le GitHub Pages Actions ufficiali. Le pull request eseguono la fase di qualità senza deploy.

Luma, inclusa in `public/luma/`, usa un backend Python separato con database SQLite e area di amministrazione per approvare i giocatori. Il frontend resta su GitHub Pages; account e progressi restano sul server. Consulta [docs/LUMA-ACCOUNT-SETUP.md](docs/LUMA-ACCOUNT-SETUP.md).

URL previsto: `https://polfick-lgtm.github.io/Brain-Training-Suite/`

## Architettura e collaborazione

- [Software Blueprint](docs/SOFTWARE_BLUEPRINT.md)
- [Note di rilascio v1.0](docs/RELEASE_V1.md)
- [Stato delle attività](docs/TASKS.md)
- [Guida per contribuire](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

Licenza non ancora definita: prima di riutilizzare o distribuire il codice fuori dal repository, contattare il proprietario.
