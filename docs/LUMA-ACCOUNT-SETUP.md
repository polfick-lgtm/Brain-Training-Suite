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

Il workflow usa l’endpoint personale `https://regulator-underfed-query.ngrok-free.dev`.
La **repository variable** GitHub Actions `LUMA_API_BASE_URL` permette di sostituirlo
con un altro indirizzo HTTPS approvato. È un indirizzo pubblico, non una chiave o credenziale.
Il workflow genera `public/luma/config.js` da questo indirizzo; nessuna credenziale di server o
amministratore viene inclusa nei file pubblici.

### Tunnel personale ngrok

Il tunnel viene eseguito sullo stesso server del backend e inoltra esclusivamente
verso `http://127.0.0.1:8796`. Non usa dominio, account o tunnel Cloudflare aziendali.
Il frontend rimane su GitHub Pages. `Install-LumaNgrok.ps1` verifica l’hash del binario,
la compatibilità effettiva e la configurazione prima di creare il task `LumaTunnel`
come LocalService. L’ispezione delle richieste e l’interfaccia web locale dell’agente
sono disabilitate. Il token è nel solo file protetto `C:\LumaApi\tunnel\private\ngrok.yml`;
non va passato come argomento di processo, copiato nel repository o mostrato nei log.

`Deploy-LumaNgrok.ps1` chiede le credenziali Windows in modo protetto, importa il token
da un file cifrato DPAPI dell’utente corrente e verifica HTTPS e CORS dall’esterno.
Se la verifica pubblica non riesce, arresta e disabilita il task del tunnel.
`-SkipBackendUpdate` consente di riprendere la configurazione quando il backend è già
stato aggiornato e il relativo risultato è disponibile; non ripete il rilascio API.

Il client aggiunge l’header `ngrok-skip-browser-warning` documentato dal provider
solo per gli endpoint gratuiti ngrok. Il backend consente questo header in preflight
mantenendo l’elenco esplicito degli origin autorizzati. L’header non dà accesso ai profili:
registrazione, approvazione e sessioni restano gestite da Luma.

Il piano gratuito ha quote di utilizzo e dipende dalla disponibilità del servizio;
controllare la pagina Usage dell’account prima di estendere il numero di giocatori.
Per interrompere la pubblicazione: arrestare e disabilitare solo `LumaTunnel`.
Il backend e il database rimangono sul server e continuano ad ascoltare su loopback.

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

Ogni giorno comprende cinque coppie di frasi italiano/inglese (40 in totale).
Il tutor sintetico legge prima l’italiano; dopo la fine della lettura lascia una
pausa di 3, 5 o 8 secondi per il tentativo dell’allievo, mostra e legge l’inglese,
quindi invita alla ripetizione. Sono disponibili lettura inglese lenta, riascolto,
visualizzazione manuale e interruzione dell’audio. Cambiare frase, pagina, profilo
o nascondere la scheda annulla le letture e le pause pendenti.

L’allievo conferma liberamente di aver ripetuto ogni frase: non viene registrato
né valutato il microfono. Questa pratica si salva nel profilo e sblocca il quiz
del giorno. I quattro esercizi usano le stesse frasi appena praticate; ogni risposta
errata viene riproposta una volta come ripasso mirato prima del risultato.
I giorni completati rimangono disponibili per il ripasso e la scheda stampabile
contiene tutte e cinque le coppie di frasi. L’audio dipende dalle voci del dispositivo.

La sezione Traduttore e i collegamenti delle singole frasi aprono Google Traduttore
in una pagina esterna su azione dell’utente. Non usano API Google private o iframe.
La modalità Google “Fai pratica” (Beta) si usa nell’app Google secondo la relativa
guida ufficiale: non è incorporata in Luma e i suoi progressi non vengono importati.
Luma non invia a Google il profilo o i progressi; il testo viene condiviso soltanto
quando l’utente apre una frase o invia il modulo di traduzione.

In sviluppo locale, senza configurazione API, il frontend mostra una schermata di servizio in preparazione.
Un health locale positivo non prova il funzionamento pubblico né l’accesso da cellulare.
