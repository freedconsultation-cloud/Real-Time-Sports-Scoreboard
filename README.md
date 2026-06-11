# Real-Time Sports Scoreboard

Live sports scores for NFL, NBA, MLB, NHL, and Premier League — updated every 30 seconds via Socket.IO. Includes real-time key-event notifications, play-by-play commentary, and Firebase auth for saving favourite teams.

> **Desktop only — no mobile support.**

## Tech Stack

- **Client**: React + Vite + Tailwind CSS + Recharts + Socket.IO client
- **Server**: Node.js + Express + Socket.IO
- **Auth / DB**: Firebase Auth (Google OAuth + email) + Firestore
- **Data**: ESPN unofficial scoreboard API (no API key required)
- **Deploy**: Render

## Local Development

### 1. Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in methods → Google + Email/Password
3. Enable **Firestore Database** → Start in test mode
4. Go to Project Settings → Web app → copy the config values

### 2. Environment Variables

```bash
cp client/.env.example client/.env.local
```

Fill in `client/.env.local`:

```
VITE_SERVER_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run

```bash
npm install   # installs root + server + client
npm run dev   # starts server on :3001 and client on :5173
```

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com) pointing to this repo
3. Render auto-detects `render.yaml` — click **Apply**
4. In the service's **Environment** tab, add all six `VITE_FIREBASE_*` values manually
5. Trigger a deploy — Render builds the client and serves everything from the Node server

## Features

- Live scores with 30-second polling via Socket.IO rooms
- Key-event toast notifications (scores, final whistle)
- Play-by-play commentary feed per game
- Per-game score bar chart (Recharts)
- Google OAuth + email/password login
- Firestore-backed favourite teams with filter toggle
- Dark theme, live indicator dot, connection status
