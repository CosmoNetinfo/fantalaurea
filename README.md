# 🎓 FantaLaurea

> Il gioco fantasy della laurea — ispirato al FantaSanremo

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CosmoNetinfo/fantalaurea)
![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-lightgrey)
![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-yellow)
![Firebase](https://img.shields.io/badge/backend-Firebase%20Firestore-orange)

---

## 🎯 Cos'è

**FantaLaurea** è una web app per rendere la giornata della laurea ancora più divertente. Funziona come il Fantacalcio: ogni partecipante sceglie una squadra di persone presenti alla cerimonia (professori, familiari, amici) e guadagna punti in tempo reale ogni volta che quelle persone fanno qualcosa di divertente, commovente o imbarazzante.

I punteggi si aggiornano live su tutti i telefoni. Nessuna installazione richiesta — basta aprire il link.

---

## ✨ Funzionalità

| Feature | Descrizione |
|---|---|
| 🔵 Login con Google | Accesso rapido tramite account Google |
| 🔢 Login con PIN | Nome + PIN 4 cifre, con riconoscimento automatico al ritorno |
| 👥 Draft squadra | Ogni giocatore sceglie le sue persone dal roster |
| 👑 Capitano | Una persona della squadra vale punti doppi |
| ⚡ Punteggi live | Aggiornamento automatico ogni 4 secondi su tutti i dispositivi |
| 📂 Importa JSON | Carica bonus/malus personalizzati da file |
| 🏆 Classifica finale | Podio animato con coriandoli |
| ❓ Guida in-app | Spiegazione completa sempre accessibile ai partecipanti |
| 🔐 Pannello Admin | Setup, Roster, Bonus/Malus, Gioco, Giocatori |

---

## 🛠️ Stack tecnico

- **Frontend:** HTML / CSS / JavaScript vanilla — nessun framework, nessuna dipendenza npm
- **Backend:** Firebase Firestore (REST API pura via `fetch()` — niente SDK)
- **Auth:** Firebase Authentication (Google + PIN custom)
- **Deploy:** Vercel (file statico singolo)
- **Realtime:** Polling ogni 4 secondi

> Scelta deliberata di non usare l'SDK Firebase per massimizzare la compatibilità con tutti i browser mobili ed evitare problemi CSP.

---

## 🚀 Deploy

### 1. Crea il progetto Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuovo progetto
3. Attiva **Firestore Database** (modalità test)
4. Attiva **Authentication** → Sign-in method → **Google**
5. In Authentication → **Domini autorizzati** → aggiungi il tuo dominio Vercel

### 2. Configura l'app

Apri `index.html` e aggiorna la sezione `FIREBASE_CONFIG` con i tuoi dati:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "LA-TUA-API-KEY",
  authDomain:        "il-tuo-progetto.firebaseapp.com",
  projectId:         "il-tuo-progetto",
  storageBucket:     "il-tuo-progetto.firebasestorage.app",
  messagingSenderId: "XXXXXXXXXX",
  appId:             "1:XXXXXXXXXX:web:XXXXXXXXXX"
};
```

### 3. Deploy su Vercel

```bash
git clone https://github.com/CosmoNetinfo/fantalaurea.git
cd fantalaurea
# aggiungi index.html configurato
git add .
git commit -m "feat: configurazione Firebase"
git push origin main
```

Importa il repo su [vercel.com](https://vercel.com) → deploy automatico.

---

## 🎮 Come si usa

### Admin

```
1. Apri l'app → clicca 🔐 → inserisci password admin (default: admin123)
2. Tab Setup      → imposta nome partita e persone per squadra
3. Tab Roster     → aggiungi le persone giocabili (prof, familiari, amici…)
4. Tab Bonus/Malus → carica preset o importa JSON personalizzati
5. Tab Gioco      → Apri Draft → manda il link nel gruppo
6. Durante la cerimonia → assegna eventi in tempo reale
7. Alla fine → Termina → appare la classifica finale
```

### Giocatori

```
1. Apri il link ricevuto su WhatsApp
2. Accedi con Google oppure inserisci Nome + PIN
3. Scegli la tua squadra durante il Draft
4. Nomina il Capitano (punti doppi 👑)
5. Segui la classifica live durante la cerimonia
```

---

## 📂 File inclusi

```
fantalaurea/
├── index.html                    # App completa (single file)
├── vercel.json                   # Configurazione Vercel
├── bonusmalus_fantalaurea.json   # 30 eventi per laurea in Graphic Design
├── bonusmalus_vestiti.json       # 20 eventi su look e accessori
└── README.md
```

### Formato JSON bonus/malus

```json
[
  { "name": "Risposta perfetta", "points": 5,  "emoji": "⭐" },
  { "name": "Telefono che squilla", "points": -8, "emoji": "📵" }
]
```

---

## 🗄️ Struttura Firestore

```
game/
  config → { name, teamSize, adminPassword, status }

roster/
  {id} → { name, role, totalPoints }

bonusMalus/
  {id} → { name, points, emoji }

players/
  {nickname} → { nickname, pin, team[], captain, score, photoURL, ts }

events/
  {id} → { rosterId, rosterName, bonusId, eventName, emoji, points, ts }
```

---

## 📄 Licenza

[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)

- ✅ Puoi usare e modificare il progetto liberamente
- ✅ Devi citare l'autore originale ([CosmoNetinfo](https://github.com/CosmoNetinfo))
- ❌ Non puoi usarlo per scopi commerciali senza permesso esplicito

---

*Creato con ❤️ da [CosmoNet.info](https://www.cosmonet.info) — per rendere ogni laurea indimenticabile*
