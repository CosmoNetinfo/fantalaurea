# Attivazione di FantaLaurea v2

La nuova app usa Supabase. La demo `/demo` è indipendente dal servizio e salva solo nel browser. Il vecchio sito e il suo database Firebase non vengono modificati.

## 1. Database

Nel progetto Supabase aprire **SQL Editor → New query** e incollare l'intero file `supabase/migrations/202611060001_initial.sql`. Eseguirlo una volta su un progetto nuovo. La migrazione è transazionale: un errore annulla tutte le operazioni.

La migrazione crea cinque tabelle con Row Level Security, funzioni RPC con autorizzazione e aggiornamenti Realtime su canali privati per partita. I ruoli `anon` e `authenticated` non possono scrivere direttamente nelle tabelle: tutte le modifiche passano attraverso funzioni che validano utente, evento, stato e contenuto.

Se sono stati disattivati i privilegi automatici per nuove tabelle, non occorre riattivarli: i `GRANT` espliciti sono inclusi. Non usare regole `allow all`, né inserire una chiave `service_role` nel frontend.

## 2. Accesso

In **Authentication → Sign In / Providers**:

- Abilitare **Email**: l'organizzatore accede con un magic link.
- Per **Google**, creare un client OAuth di tipo **Applicazione web** nella Google Auth Platform. Origine autorizzata: `https://fantalaurea.vercel.app`. URI di reindirizzamento: `https://zymcaovdflmvcfvelnyj.supabase.co/auth/v1/callback` (copiarlo dal provider Supabase se cambia il progetto). Inserire **Client ID** e **Client Secret** esclusivamente nel provider Google di Supabase e abilitarlo. Lasciare disattivati Skip nonce checks e Allow users without an email. Il pulsante è disponibile per organizzatori e invitati, che ritornano rispettivamente a `/organizza` e al loro invito. In Google configurare Audience e utenti di test prima dell'apertura pubblica.
- Abilitare **Anonymous sign-ins**: gli invitati ottengono un'identità autenticata senza fornire un'email.
- In **URL Configuration** configurare il Site URL dell'app e gli indirizzi di ritorno consentiti: `http://127.0.0.1:5173/organizza` per lo sviluppo e `https://fantalaurea.vercel.app/organizza` per la pubblicazione sul dominio attuale. Aggiungere eventuali domini di staging effettivi.
- Per il ritorno Google degli invitati, consentire anche `https://fantalaurea.vercel.app/invito/*` e `https://fantalaurea.vercel.app/partecipa`. Per prove locali aggiungere le route equivalenti sotto `http://127.0.0.1:5173`. In caso di domini differenti, inserire il dominio effettivamente usato.
- Configurare un provider SMTP prima di aprire le iscrizioni al pubblico: il servizio email incorporato non sostituisce un servizio di invio di produzione.

Un invitato anonimo ritrova la squadra nello stesso browser. La cancellazione dei dati del browser e il cambio dispositivo richiedono una nuova identità. Il collegamento successivo a un account e il recupero della squadra non sono inclusi in questa prima versione.

## 3. Variabili dell'app

Copiare `.env.example` in `.env.local` e impostare:

```dotenv
VITE_SUPABASE_URL=https://ID-PROGETTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La configurazione locale del progetto indicato in chat è già presente nel checkout, esclusa da Git. Non usare la password PostgreSQL nell'app. Le due variabili sono pubbliche e vengono incluse nella build: la protezione dei dati è nelle policy e nelle RPC, non nella segretezza della chiave pubblicabile.

## 4. Avvio e pubblicazione

```powershell
npm ci
npm run dev
```

Aprire `http://127.0.0.1:5173`, `/demo` per la prova locale oppure `/organizza` per creare una vera partita. La demo mostra esplicitamente che i dati sono locali e che l'invito non condivide lo stato fra dispositivi.

Per Vercel impostare le due variabili nell'ambiente del progetto, usare Node 22 o successivo, comando `npm run build` e output `dist`. Il file `vercel.json` contiene già build e fallback delle route. Prima provare un deployment di staging: questa riscrittura non importa automaticamente i dati Firebase e non deve rimpiazzare una partita ancora in corso.

## 5. Verifica prima del rilascio

- Organizzatore con email verificata: creare una laurea, aggiungere almeno tre protagonisti, aprire le squadre.
- Due browser o telefoni diversi: entrare dallo stesso invito e salvare le squadre con capitano.
- Avviare il gioco: verificare che le squadre non si possano più modificare.
- Assegnare un bonus e un malus al capitano e verificare i punti doppi su entrambi i telefoni.
- Annullare un evento, riconnettere un telefono e verificare la classifica.
- Aprire una seconda laurea con un altro organizzatore e verificare che persone, inviti e punteggi siano separati.
- Concludere la partita e provare la condivisione del risultato.

Le prove locali verificano Postgres tramite PGlite con sostituti delle funzioni Auth/Realtime: non certificano l'invio email, i token emessi da Supabase o il trasporto WebSocket del progetto reale.

## 6. Capacità e prevenzione abusi

Questa prima versione impone 300 partecipanti, 100 protagonisti, 100 regole e 2.000 momenti registrati per partita. Non sono una garanzia di capacità del piano Supabase: prima di promuovere il servizio occorre misurare connessioni simultanee, dimensioni delle risposte e costo delle query.

Gli aggiornamenti utilizzano **Broadcast privato**, con un piccolo messaggio di invalidazione per partita, aggregazione delle notifiche e rilettura dei dati autorizzati. In caso di perdita del canale, il client mantiene i dati e riprova periodicamente; tornando in primo piano riallinea lo stato. Il punteggio è derivato dal registro degli eventi: niente riscritture di tutti i partecipanti a ogni bonus.

Supabase applica limiti agli accessi anonimi per IP, rilevanti quando molti invitati condividono il Wi-Fi. Verificarli nel pannello prima di una festa. Per un'apertura pubblica consistente, integrare e attivare CAPTCHA/Turnstile nel form e nel progetto, configurare limiti anti-abuso e una strategia di conservazione delle identità e dei dati. Il frontend attuale non invia token CAPTCHA: non abilitarne l'obbligo sul server senza completare l'integrazione.

Preparare un'informativa adeguata al servizio effettivamente pubblicato, una procedura per cancellazione dei dati e monitoraggio errori. I nomi dei protagonisti e degli invitati sono visibili ai partecipanti della loro partita, non ai visitatori estranei.

Documentazione: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Accesso anonimo](https://supabase.com/docs/guides/auth/auth-anonymous), [Realtime Broadcast](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes), [Magic link](https://supabase.com/docs/guides/auth/auth-email-passwordless).
