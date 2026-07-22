# Contribuire a Brain Training Suite

## Preparazione

1. Installa Node.js 22.
2. Esegui `npm install` nella root del progetto.
3. Crea un branch breve e focalizzato a partire da `main`.

## Regole di sviluppo

- mantieni componenti e logica di dominio modulari;
- non aggiungere analytics, pubblicità o raccolta remota di dati;
- non inserire token, credenziali, file `.env`, log o dati personali;
- usa dati anonimi nei test;
- documenta le decisioni architetturali significative nel blueprint;
- non rimuovere test o controlli per aggirare un errore.

## Controlli obbligatori

Prima di proporre una modifica esegui:

```bash
npm run lint
npm run test
npm run build
```

Per modifiche alla navigazione o all'interfaccia esegui anche `npm run test:e2e` e verifica almeno una viewport mobile.

## Commit e pull request

Usa commit descrittivi in stile Conventional Commits, per esempio `feat: add memory exercise`. La pull request deve indicare scopo, verifiche eseguite, impatto su privacy/PWA e limiti ancora noti.
