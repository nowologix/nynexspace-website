# ImmoStack Deployment Guide

## Lokale Entwicklung

### 1. Next.js Backend/Dashboard starten
```bash
npm run dev
```
Läuft auf `http://localhost:3000`

### 2. Web Frontend (Landing Page) starten
Für Entwicklung mit Live-Reload:
```bash
# Navigiere in den web Ordner
cd web

# Installiere einen einfachen HTTP Server (falls noch nicht geschehen)
npm install -g live-server

# Starte den Server
live-server --port=8080
```

Oder mit Python:
```bash
cd web
python -m http.server 8080
```

Das Web Frontend läuft dann auf `http://localhost:8080`

## API Konfiguration

Das Web Frontend (`web/config.js`) erkennt automatisch die Umgebung:

- **Entwicklung**: Verbindet sich zu `http://localhost:3000` (Next.js Backend)
- **Production**: Verwendet relative URLs (gleiche Domain)

Manuelle Override (für Sonderfälle):
```javascript
localStorage.setItem('immostack_api_url', 'http://localhost:3000')
```

## Production Deployment

### Option 1: Gleiche Domain (Empfohlen)
Next.js served sowohl das Dashboard als auch das Web Frontend:

1. **Web Frontend in Next.js public Ordner kopieren**:
```bash
cp -r web/* public/
```

2. **Oder NGINX/Apache Konfiguration**:
Beide Apps werden vom gleichen Webserver served, Next.js API läuft auf dem gleichen Port.

### Option 2: Getrennte Server
Web Frontend auf einem Server, Next.js API auf einem anderen:

1. **Umgebungsvariable setzen**:
```bash
# In web/config.js die production URL anpassen
# Oder vor dem Laden der Seite setzen:
localStorage.setItem('immostack_api_url', 'https://api.immostack.de')
```

2. **CORS Konfiguration**:
Die Next.js API Routes haben bereits CORS Headers:
```typescript
'Access-Control-Allow-Origin': '*'
```

Für Production solltest du das auf deine Domain beschränken:
```typescript
'Access-Control-Allow-Origin': 'https://immostack.de'
```

## Umgebungsvariablen

Erstelle `.env` im Root-Verzeichnis:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/immostack"

# Auth
NEXTAUTH_SECRET="dein-secret-hier"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (für Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Build & Deployment

```bash
# Dependencies installieren
npm install

# Datenbank migrieren
npm run db:push

# Demo User erstellen
npm run setup:users

# Production Build
npm run build

# Production Server starten
npm run start
```

## Testen

1. **Demo Login**:
   - Email: `test@immostack.de`
   - Passwort: `demo123`

2. **Echter Login**:
   - Registriere dich auf der Landing Page
   - Logge dich ein

## Troubleshooting

### CORS Fehler
Falls du CORS Fehler im Browser siehst, überprüfe:
1. Next.js App läuft auf Port 3000
2. CORS Headers sind gesetzt in `app/api/auth/*/route.ts`
3. Keine Firewall blockiert die Verbindung

### Login Redirect funktioniert nicht
1. Öffne Browser Console (F12)
2. Suche nach "Attempting login to:" - zeigt die API URL
3. Überprüfe ob die Next.js App läuft

### Background ist weiß statt schwarz
Die CSS Dateien wurden bereits angepasst:
- `app/globals.css`: Body und HTML haben `bg-black`
- `web/styles.css`: `--bg-primary` ist auf `#000000` gesetzt

Falls noch immer weiß: Browser Cache leeren (Ctrl+Shift+R)
