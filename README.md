# FantaLaurea

**Si laurea uno. Giocano tutti.** Il fantasy della tua laurea: scegli i protagonisti, invita gli amici, componi una squadra e segui la classifica.

[Apri l’app](https://fantalaurea.vercel.app/) · [Prova la demo](https://fantalaurea.vercel.app/demo) · [Leggi il regolamento](https://fantalaurea.vercel.app/regole)

![Icona FantaLaurea](public/icons/icon-192.png)

## Il gioco

L’organizzatore crea una laurea, inserisce le persone presenti e sceglie bonus e malus. Gli invitati entrano dal link o dal QR, scelgono una squadra e nominano un capitano, che raddoppia sia i bonus sia i malus. L’organizzatore registra i momenti dalla Regia e la classifica si aggiorna sui dispositivi dei partecipanti.

Le partite reali salvano i dati su **Supabase** e sono separate fra loro. La **demo** salva soltanto nel browser ed è identificata da un banner: serve per provare il gioco senza account e non condivide lo stato fra dispositivi.

## Interfaccia e app installabile

- Marchio vettoriale dedicato: monogramma FL, tocco accademico e dettagli dorati.
- Tema predefinito **Oro**: bianco, nero e oro, con superfici e testi a contrasto maggiore.
- Palette alternative **Verde** e **Blu**.
- Modalità **Chiaro**, **Scuro** e **Automatico**, che segue il dispositivo.
- Preferenze salvate sul dispositivo, indipendenti dai dati delle partite.
- Impostazioni accessibili dal pulsante **App e aspetto**; durante una partita il comando è nella barra superiore.
- Icone PNG 192 e 512 px, variante Android maskable, icona Apple 180 px, favicon SVG/ICO/PNG.
- Manifest PWA e avvio standalone dalla schermata Home, senza la normale barra del browser quando il sistema lo consente.
- Demo e regolamento consultabili offline dopo il primo caricamento completo. Le partite condivise richiedono internet.
- Aggiornamenti dell’app segnalati nelle impostazioni e applicati su richiesta, per non ricaricare la pagina durante il gioco.
- Font inclusi nella build, senza dipendere da Google Fonts durante l’uso.

**Installazione:** apri le impostazioni dell’app. Su Android usa il pulsante di installazione quando il browser lo propone, oppure il menu di Chrome. Su iPhone apri il sito in Safari e scegli **Condividi → Aggiungi alla schermata Home**. I menu e la disponibilità dipendono dal browser e dal sistema operativo.

## Regolamento

La pagina `/regole` è pubblica e contiene:

- percorso per l’organizzatore, dalla preparazione alla conclusione;
- percorso per il giocatore, dall’invito al salvataggio della squadra;
- esempi di bonus e malus del capitano;
- pareggi, correzioni, accessi tardivi e differenze fra demo e partite reali;
- istruzioni su installazione e connessione.

Dentro la partita il pulsante con il punto interrogativo mostra anche i bonus e malus specifici di quella laurea. Il regolamento è raggiungibile dal sito, dalla pagina di ingresso e dalla guida della partita.

## Funzioni

- Partite private indipendenti e inviti tramite codice, link e QR.
- Google per organizzatori e invitati, magic link email, nickname con Auth anonima.
- Protagonisti e regole modificabili, con dieci bonus e malus iniziali.
- Stati preparazione → squadre aperte → gioco → conclusione, validati nel database.
- Squadre con protagonisti distinti e capitano appartenente alla formazione.
- Regia con protezione dai doppi invii e annullamento tracciato.
- Classifica derivata dal registro degli eventi e condivisione testuale del risultato.
- Notifiche su canali privati per partita, riconnessione e aggiornamenti periodici di riserva.
- Gestione esplicita del ritorno Google e degli errori di autenticazione.

## Avvio locale

Richiede Node.js 22 o successivo.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Imposta in `.env.local` l’URL e la chiave pubblicabile del tuo progetto Supabase. Non sovrascrivere un file di configurazione locale già compilato. Apri `http://127.0.0.1:5173`.

La demo funziona anche senza collegamento Supabase. Per le partite reali servono schema, provider di accesso e indirizzi di ritorno descritti in [SETUP_SUPABASE.md](SETUP_SUPABASE.md).

## Verifiche

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:pwa
```

`test:pwa` usa la build di produzione: esegui prima `npm run build`. Per un Chromium già installato, imposta `PLAYWRIGHT_CHROMIUM_EXECUTABLE` al suo percorso assoluto.

I controlli coprono:

- regole di punteggio, capitani, annullamenti e pari merito;
- migrazione PostgreSQL, autorizzazioni, isolamento delle lauree e doppi invii;
- ritorni OAuth simulati, sessione dopo il ricaricamento e gestione degli errori;
- partita completa su desktop e mobile;
- palette chiare e scure, persistenza delle preferenze e contrasto dei testi principali;
- regolamento su telefono stretto, overflow orizzontale e risorse del marchio;
- manifest PWA, dimensioni effettive delle icone e avvio offline della demo e delle regole.

Le verifiche automatiche usano Chromium e l’emulazione mobile. Non sostituiscono una prova di installazione su iPhone e Android reali. I test del database usano PGlite con sostituti delle funzioni Supabase Auth/Realtime: non certificano il servizio email o il trasporto WebSocket del progetto remoto. Il controllo del contrasto riguarda gli elementi campionati e non costituisce una certificazione completa di accessibilità.

## Marchio e personalizzazione

Il master vettoriale è `public/brand/app-icon.svg`. Per rigenerare tutte le icone dopo averlo modificato:

```powershell
npm run assets
```

Le dimensioni e i ritagli dei PNG sono generati dal codice in `scripts/generate-icons.mjs`, non dichiarati soltanto nel manifest. La variante maskable mantiene il simbolo nell’area centrale. Le palette e la resa del marchio sono in `src/themes.css`; le preferenze sono gestite da `src/appearance.ts`.

## Struttura

- `src/domain.ts`: calcolo punteggi e validazione squadra.
- `src/demo.ts`: sandbox locale distinta dalle partite online.
- `src/api.ts`, `src/authReturn.ts`: Supabase, sessioni e ritorni di accesso.
- `src/App.tsx`: percorsi organizzatore/giocatore e partita.
- `src/RulesPage.tsx`: regolamento pubblico.
- `src/Brand.tsx`, `public/brand/`, `public/icons/`: marchio e icone.
- `src/AppSettings.tsx`, `src/appearance.ts`, `src/themes.css`: preferenze e installazione.
- `supabase/migrations/`: PostgreSQL, RLS, funzioni transazionali e notifiche private.
- `tests/`: verifiche di dominio, database, browser e PWA.
- `legacy/`: versione originale Firebase per riferimento; esclusa dalla build.

## Pubblicazione

Vercel compila con `npm run build` e pubblica `dist`. Le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` devono essere presenti nell’ambiente di build. Dopo averle cambiate serve un nuovo deployment. `vercel.json` include il fallback delle pagine e intestazioni per manifest e service worker.

Questa riscrittura non importa automaticamente i dati Firebase. Prima di usare una laurea con gli invitati, provare creazione, ingresso da un secondo dispositivo, salvataggio della squadra, punteggi live e annullamento di un evento.

## Licenza

Rimane la licenza originale [CC BY-NC 4.0](LICENSE). Progetto di [CosmoNet](https://www.cosmonet.info), [CosmoNetinfo](https://github.com/CosmoNetinfo). I font e le librerie mantengono le rispettive licenze incluse nei pacchetti.
