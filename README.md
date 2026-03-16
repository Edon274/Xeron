# Xeron

Xeron ist ein lokaler, intelligenter digitaler Lebensassistent fuer:
- Vertraege
- Abos
- Rechnungen
- Dokumente
- Insights und Sparhinweise

## Stack
- Next.js (App Router)
- TypeScript + React
- Tailwind CSS
- Prisma ORM
- SQLite (lokal)
- Framer Motion
- Ollama (lokale KI)

## Lokales Setup
1. `npm install`
2. `npx prisma generate`
3. `npx prisma db push`
4. Optional Seed: `npm run prisma:seed` (oder `node prisma/seed.js`)
5. Ollama starten:
   - `ollama pull llama3`
   - `ollama serve`
6. Dev starten: `npm run dev`
7. App oeffnen: `http://localhost:3000`

## KI-Architektur
- Frontend ruft nur interne Route auf:
  - `POST /api/assistant`
- Server-Route sendet an:
  - `POST http://localhost:11434/api/chat`
- Assistant bekommt Live-Kontext aus DB:
  - Vertraege, Abos, Rechnungen, Dokumente, Automations-Plan

## KI-Automationen
- Dokument-Upload analysiert Inhalt lokal ueber Ollama.
- Erkannte Typen (`INVOICE`, `CONTRACT`, `SUBSCRIPTION`) werden automatisch in passende Datensaetze uebernommen und mit dem Dokument verknuepft.
- Automations-Plan API:
  - `GET /api/automation/plan`

## Wichtige Ordner
- `src/app` Seiten + API-Routen
- `src/components` UI/Feature-Komponenten
- `src/lib` Prisma, Uploads, Ollama, Dokumentanalyse
- `prisma` Schema + Migrationen

## Nutzer-Isolation
- Xeron nutzt Login/Registrierung.
- Alle Datensaetze werden pro User isoliert gespeichert (`demoUserId` Feld als Owner-ID).

## Auth & WLAN
- Xeron laeuft auf deinem PC als Server.
- Andere Geraete im gleichen WLAN koennen zugreifen, aber nur mit eigenem Login.
- Jede API ist user-isoliert: Daten werden pro eingeloggtem User gefiltert.
- Auth-Routen:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Setze fuer bessere Sicherheit in `.env`:
  - `AUTH_SECRET="DEIN_LANGER_RANDOM_SECRET"`

## Logo Integration
- Lege dein Logo hier ab:
  - `public/branding/xeron-logo.png`
- Es wird automatisch in Sidebar und Landing verwendet.
