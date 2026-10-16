# Luma: profili e area amministrativa

Il frontend Luma è pubblicato su GitHub Pages, sotto `/Brain-Training-Suite/luma/`.
Il backend Python e il database SQLite risiedono sul server Windows autorizzato,
in una cartella dedicata `C:\LumaApi`. Non sono richiesti Supabase né servizi email.

## Registrazione e approvazione

1. Il giocatore inserisce nome, email e password (12–128 caratteri).
2. Il server crea un profilo `pending`. Nessuna email viene inviata; l’indirizzo
   è un identificativo dichiarato dall’utente, non una casella verificata.
3. L’amministratore accede a Luma e apre **Amministrazione**. Le richieste in
   attesa compaiono per prime, con nome e email; i pulsanti consentono di approvare
   o rifiutare. L’accesso amministrativo è verificato dal server a ogni richiesta.
4. Il giocatore approvato accede al percorso e ritrova i progressi da ogni dispositivo.
   Revocare un accesso invalida tutte le sessioni del giocatore.

Il server determina il proprietario dei progressi dalla sessione autenticata:
il browser non può scegliere un altro account né assegnarsi il ruolo amministratore.
Le password sono conservate come hash PBKDF2-HMAC-SHA256 con sale casuale e 600.000
iterazioni; i token di sessione sono casuali e nel database ne è conservato solo
l’hash SHA-256. Sono presenti limiti persistenti ai tentativi di login e registrazione.

## Installazione isolata sul server

Da PowerShell 7 sul PC di amministrazione:

```powershell
python -m pip download --only-binary=:all: --no-deps waitress==3.0.2 -d <cartella-wheel-locale>
.\deploy\Deploy-LumaServer.ps1 -WheelPath <percorso-wheel-waitress> -ResultPath <risultato-locale.json>
```

Lo script richiede la credenziale Windows tramite `Get-Credential`. Alla prima
installazione richiede separatamente la password del nuovo account amministratore
Luma: questa password non viene salvata in chiaro né passata in argomenti di processi.
Solo il relativo hash salato viene trasferito al server e acquisito nel database.

Il metodo di accesso è SMB e CIM/DCOM con credenziale esplicita, come nel deploy
Bybit già presente. Non richiede di modificare `TrustedHosts` o di eseguire il client
locale come amministratore. Sono invece necessari i permessi amministrativi sul server.

L’installazione:

- crea `C:\LumaApi` con ACL per amministratori, SYSTEM e account di servizio;
- prepara una copia separata dell’interprete Python 3.12 e della libreria standard
  già disponibili sul server; esclude pacchetti, script e configurazioni Bybit;
- installa Waitress 3.0.2 nel solo percorso di librerie Luma, senza modificare Python globale;
- distribuisce codice e librerie in cartelle di rilascio con manifest SHA-256;
- avvia il task `LumaApi` come LocalService, con riavvio in caso di errore;
- ascolta solo su `127.0.0.1:8796`, verifica health e integrità SQLite;
- mantiene account e progressi nella cartella dati condivisa tra i rilasci.

I database VMware e Windows trovati sul server non sono utilizzati.
I task e i servizi Bybit non vengono arrestati o modificati.

## HTTPS e configurazione di GitHub Pages

La pagina ospitata su GitHub deve poter chiamare un endpoint HTTPS del backend.
Un IP privato, da solo, non è raggiungibile da Internet. Configurare un reverse proxy
o tunnel approvato verso `http://127.0.0.1:8796` e verificarne DNS, certificato e health
pubblici prima di attivare gli account dal frontend. Non esporre il database SQLite,
le condivisioni amministrative o i servizi VMware.

Impostare la **repository variable** GitHub Actions `LUMA_API_BASE_URL` all’indirizzo
HTTPS approvato. È un indirizzo pubblico, non una chiave o credenziale. Il workflow
genera `public/luma/config.js` da questa variabile; nessuna credenziale di server o
amministratore viene inclusa nei file pubblici.

`C:\LumaApi\config\config.json` definisce gli origin CORS consentiti, la durata delle
sessioni e il percorso dati. L’origin di GitHub Pages è `https://polfick-lgtm.github.io`
(senza percorso). Il dominio del frontend e quello dell’API devono coincidere con
la configurazione effettiva. Eventuali header proxy devono essere configurati
esclusivamente per il proxy autorizzato, senza fidarsi di header forniti da Internet.

## Backup, aggiornamenti e rollback

A ogni aggiornamento il programma di installazione esegue un backup consistente
SQLite tramite l’API `Connection.backup`, conserva il rilascio precedente e salva
la definizione del task. Se il controllo health fallisce, ripristina il task
precedente; account e progressi non vengono eliminati. I backup contengono dati
personali e hash di credenziali e restano sotto le ACL della cartella server.

Per una prima creazione manuale dell’amministratore, sul server:

```powershell
C:\LumaApi\runtime\python.exe -I C:\LumaApi\releases\<release>\app\run.py --config C:\LumaApi\config\config.json --create-admin
```

Il comando chiede la password in modo protetto. Il bootstrap rifiuta di sovrascrivere
un amministratore esistente. In caso di smarrimento della password è necessario
un intervento amministrativo sul server; non è previsto un recupero via email.

## Verifiche e limiti

`npm run verify` comprende controlli frontend e test del backend. Per i test browser
con backend reale, installare `server/requirements.txt` nell’ambiente Python di test;
è possibile selezionarlo con la variabile `LUMA_TEST_PYTHON`. I test utilizzano un
database temporaneo, utenti fittizi e una porta locale; non chiamano Bybit né servizi email.

Prima del rilascio verificare registrazione, approvazione dall’area amministrativa,
blocco dei pending/rifiutati, isolamento tra account, riapertura da un secondo
dispositivo e revoca delle sessioni. La prima associazione del vecchio salvataggio
locale resta limitata al relativo account. Una copia dei progressi resta nel browser;
gli aggiornamenti concorrenti dello stesso profilo seguono l’ultimo salvataggio ricevuto.

Il percorso 8 Giorni usa esercizi e frasi originali Luma. Non include video, PDF
proprietari, dirette o tutor del corso Learnworlds preso come riferimento.

Senza `LUMA_API_BASE_URL`, il frontend mostra una schermata di servizio in preparazione.
Un health locale positivo non prova il funzionamento pubblico né l’accesso da cellulare.
