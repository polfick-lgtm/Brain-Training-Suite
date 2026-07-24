# Audit iniziale v1.0

Data audit: 23 luglio 2026.

## Baseline verificata

- React 18, TypeScript strict, Vite e React Router presenti.
- Stato applicativo persistito con Zustand e `localStorage`.
- Torre di Hanoi giocabile con logica coperta da quattro test unitari.
- Home, Progressi, Profilo e Hanoi coperte da quattro smoke test Playwright.
- PWA e deploy GitHub Pages funzionanti sotto `/Brain-Training-Suite/`.
- `lint`, `test`, `build`, E2E e audit dipendenze verdi all'inizio del lavoro v1.0.

## Scostamenti dalla specifica v1.0

- assenti nove dei dieci giochi richiesti e un contratto condiviso completo;
- assenti catalogo Giochi, Sessioni, Impostazioni, pagina 404 ed error boundary;
- storage limitato a Zustand/localStorage, senza Dexie, migrazioni o repository tipizzati;
- assenti preferenze accessibilità, import/export e cancellazione completa;
- assenti session builder, coach locale e statistiche per area/periodo;
- PWA senza prompt di aggiornamento esplicito e test offline dedicato;
- mancavano gli script `typecheck`, `test:coverage` e `verify`;
- workflow privo del quality gate unico `npm run verify`;
- refresh diretto delle route profonde da verificare e rendere affidabile su GitHub Pages.

## Rischi e criteri

- migrare i dati v0.1 senza perdere profilo o sessioni esistenti;
- mantenere ogni punteggio descrittivo e non clinico;
- evitare dipendenze non necessarie e qualsiasi traffico applicativo verso servizi esterni;
- mantenere build verde dopo ogni milestone BTS.
