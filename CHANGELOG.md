# Changelog

Le modifiche rilevanti al progetto sono documentate in questo file secondo i principi di [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/).

## [Unreleased]

### Aggiunto

- audit v1.0 e tracciamento delle milestone BTS;
- quality gate unificato con typecheck, copertura e verifica formato;
- contratto TypeScript condiviso per giochi e risultati.
- catalogo giochi e route per Sessioni e Impostazioni;
- pagina 404, error boundary, skip link e gestione del focus tra route;
- navigazione mobile completa e leggibile.
- persistenza IndexedDB con Dexie e migrazione automatica dei dati v0.1;
- preferenze tema, dimensione testo, riduzione animazioni, suoni e coach;
- export, import validato e cancellazione completa con doppia conferma.
- Torre di Londra giocabile con difficoltà, pausa, tastiera, punteggio e salvataggio;
- runner condiviso per giochi a round con timer e risultati standardizzati.
- Memory, Memoria visiva, Digit Span e Simon;
- Stroop, Trail Making, Test di reazione e N-Back;
- smoke test Playwright dedicato a tutte le dieci route di gioco.
- filtri statistiche per periodo e gioco, aggregazioni locali e migliori risultati;
- grafico accessibile con riepilogo tabellare equivalente e caricamento differito.
- session builder da 3–5 esercizi per obiettivo e durata;
- timer globale, pausa, interruzione sicura e avanzamento automatico tra giochi.
- coach locale deterministico con massimo tre suggerimenti motivati e disattivabili.

## [0.1.0] - 2026-07-22

### Aggiunto

- struttura React, TypeScript e Vite;
- navigazione Home, Progressi, Profilo e Torre di Hanoi;
- persistenza locale di profilo e sessioni con Zustand;
- configurazione PWA mobile-first;
- test Vitest e Playwright;
- pipeline GitHub Actions per qualità e GitHub Pages;
- documentazione Foundation e guida ai contributi.
