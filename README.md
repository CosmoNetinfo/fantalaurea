# FantaLaurea v2

Il fantasy della tua laurea: scegli i protagonisti, invita gli amici, componi una squadra e segui la classifica. Riscrittura in React e TypeScript con Supabase Auth, PostgreSQL e Realtime Broadcast.

## Avvio

```powershell
npm ci
Copy-Item .env.example .env.local
# Configura URL e chiave pubblicabile del tuo progetto.
npm run dev
```

Apri http://127.0.0.1:5173. La demo `/demo` funziona anche senza Supabase e conserva i dati nel browser. Le vere partite richiedono lo schema e le impostazioni descritte in [SETUP_SUPABASE.md](SETUP_SUPABASE.md).

## Cosa comprende

- Pagina pubblica responsive e interfaccia italiana per organizzatori e invitati.
- Partite indipendenti e private, con inviti tramite codice, link e QR.
- Accesso Google per organizzatori e invitati, magic link email e partecipazione con nickname tramite Auth anonima.
- Protagonisti, bonus/malus modificabili e dieci regole iniziali.
- Scelta della squadra e del capitano, punti doppi anche sui malus.
- Stati preparazione → squadre aperte → gioco → conclusione, validati nel database.
- Regia degli eventi, protezione dai doppi invii e annullamento tracciato.
- Classifica derivata dal registro eventi, senza scritture di punteggio su ogni giocatore.
- Notifiche private per partita con riconnessione e aggiornamenti periodici di riserva.
- Classifica finale e condivisione testuale del risultato.

## Verifiche

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Per usare un browser già installato, impostare `PLAYWRIGHT_CHROMIUM_EXECUTABLE` al percorso assoluto di Chromium. I test di browser coprono desktop e mobile. I test Postgres verificano la migrazione reale con PGlite e sostituti delle funzioni Supabase Auth/Realtime: isolamento delle lauree, permessi, blocco delle squadre, idempotenza, annullamenti e riferimenti fra partite.

## Struttura

- `src/domain.ts`: regole di punteggio e validazione squadra.
- `src/demo.ts`: sandbox locale esplicitamente separata dalle partite online.
- `src/api.ts`: client Supabase e funzioni RPC.
- `src/App.tsx`: pagine, percorsi organizzatore/giocatore e aggiornamenti live.
- `src/styles.css`: interfaccia responsive, navigazione mobile e stati di accessibilità.
- `supabase/migrations/`: schema PostgreSQL, RLS, transazioni e notifiche private.
- `tests/`: verifiche funzionali, database e browser.
- `legacy/firebase-index.html`: copia della versione originale per riferimento; non viene inclusa nella build.

La migrazione non trasferisce i dati Firebase. Prima di sostituire il sito pubblico occorre configurare email, accesso anonimo, URL di ritorno, provare due dispositivi reali e completare la verifica di capacità e anti-abuso. I dettagli e i limiti della prima versione sono documentati nella guida di attivazione.

## Licenza

Rimane la licenza originale [CC BY-NC 4.0](LICENSE). Progetto di [CosmoNet](https://www.cosmonet.info), [CosmoNetinfo](https://github.com/CosmoNetinfo).
