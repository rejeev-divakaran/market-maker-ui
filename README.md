# MarketMaker Configuration UI

A developer web UI for CRUD operations on all MarketMaker V2 configuration entities, with live price streaming via WebSocket.

## Prerequisites

- Node.js 18+ and npm
- Access to a running MarketMaker backend server

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Full URL to the SSO login endpoint
LOGIN_URL=http://<host>:<port>/fxi/admin/sso/login

# Base URL prefix for all MarketMaker REST API calls
API_URL_PREFIX=http://<host>:<port>

# WebSocket URL for live price streaming (optional — REST UI works without it)
WS_URL=ws://<host>:<port>/fxstream

# Port this UI server listens on (default: 3000)
PORT=3000

# Secret used to sign sessions (change in any shared environment)
SESSION_SECRET=change-me
```

> `WS_URL` is optional. If omitted, the REST CRUD operations work normally but the live price panels will show "Stream (no URL)".

## Run

**Development** (auto-restart on file changes):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Login

Enter your **username**, **password**, and **organization short name**. On success the server:

1. Calls `POST LOGIN_URL` with `CLIENT_TYPE: BROWSER` header.
2. Extracts `SSO_TOKEN` from the `Set-Cookie` response header and stores it in the session.
3. Opens a WebSocket to `WS_URL` using the `SSO_TOKEN` cookie and sends the subscription message:
   ```json
   {"marketMakerSubscriptionRequests": [{"action": "SUBSCRIBE", "organization": "<org>"}]}
   ```

All subsequent REST requests proxy through the server with the `SSO_TOKEN` cookie attached automatically.

## Features

### REST CRUD (6 tabs)

| Tab | API base path |
|-----|--------------|
| Broker Configuration | `/marketMaker/broker-configurations` |
| Core Pricing | `/marketMaker/pricing` |
| Provider Configuration | `/marketMaker/broker-configurations/.../providers` |
| Stream Pricing | `/marketMaker/streamprices` |
| Tier Pricing | `/marketMaker/tierprices` |
| Forward Points | `/marketMaker/forwardpoints` |

Each tab exposes all GET / POST / PUT / DELETE operations for that domain. Request bodies are pre-populated with JSON templates that you edit in-place before executing.

### Live Price Streaming

Three tabs display a live feed of streaming messages received from the backend WebSocket, in **most-recent-first** order:

| Tab | Message type |
|-----|-------------|
| Core Pricing | `mmCorePriceData` |
| Tier Pricing | `mmTieredPriceData` |
| Forward Points | `forwardPointsData` |

The stream status indicator in the top-right corner shows:
- **grey dot** — `WS_URL` not configured
- **green dot** (glowing) — connected and streaming
- **red dot** — disconnected

## Project Structure

```
market-maker-ui/
├── server.js          # Express proxy server + WebSocket relay
├── public/
│   ├── index.html     # Single-page shell with CSS
│   └── app.js         # Data-driven UI: operations config, rendering, WS client
├── .env.example       # Template for environment variables
├── package.json
└── README.md
```

## Console Logging

Every REST API call is printed to the server console:

```
[2026-06-07T22:00:00.000Z] POST /api/proxy/marketMaker/pricing/ACME/currencyPairs/EUR/USD  →  200 (38ms)
  --> POST http://backend:8080/marketMaker/pricing/ACME/currencyPairs/EUR/USD
  REQ BODY: { ... }
  <-- 200
  RES : { ... }
```

WebSocket messages from the backend are logged as:

```
[WS] ← {"mmCorePriceData":{"organization":"ACME","currencyPair":"EUR/USD",...}}
```

Heartbeats are suppressed from both the console and the browser feed.
