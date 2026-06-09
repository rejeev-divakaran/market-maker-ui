require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const LOGIN_URL = process.env.LOGIN_URL;
const API_URL_PREFIX = process.env.API_URL_PREFIX;
const WS_URL = process.env.WS_URL;

if (!LOGIN_URL || !API_URL_PREFIX) {
  console.error('ERROR: LOGIN_URL and API_URL_PREFIX must be set. Create a .env file (see .env.example).');
  process.exit(1);
}
if (!WS_URL) {
  console.warn('WARNING: WS_URL not set — live price streaming will not be available.');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Request/response logger (skips static assets)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  const start = Date.now();
  const originalJson = res.json.bind(res);
  let responseBody;
  res.json = (body) => { responseBody = body; return originalJson(body); };
  res.on('finish', () => {
    const ms = Date.now() - start;
    const ts = new Date().toISOString();
    console.log(`\n[${ts}] ${req.method} ${req.path}  →  ${res.statusCode} (${ms}ms)`);
    if (req.body && Object.keys(req.body).length) {
      const logged = req.path === '/api/login' ? { ...req.body, pass: '***' } : req.body;
      console.log('  REQ :', JSON.stringify(logged, null, 2).replace(/\n/g, '\n        '));
    }
    if (responseBody !== undefined) {
      console.log('  RES :', JSON.stringify(responseBody, null, 2).replace(/\n/g, '\n        '));
    }
  });
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'mm-ui-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 }
}));

// ─── Backend WebSocket management ─────────────────────────────────────────

let backendWs = null;
let heartbeatInterval = null;
const browserClients = new Set();

function broadcastToBrowsers(msg) {
  const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
  browserClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  });
}

function connectBackendWs(ssoToken, org) {
  if (!WS_URL) {
    console.warn('[WS] Skipping backend connection: WS_URL not configured');
    return;
  }

  disconnectBackendWs();

  console.log(`[WS] Connecting to backend: ${WS_URL}`);
  backendWs = new WebSocket(WS_URL, [], {
    headers: { Cookie: `SSO_TOKEN=${ssoToken}` }
  });

  backendWs.on('open', () => {
    console.log('[WS] Backend connected');

    const sub = JSON.stringify({
      marketMakerSubscriptionRequests: [{ action: 'SUBSCRIBE', organization: org }]
    });
    backendWs.send(sub);
    console.log(`[WS] → Subscription sent: org=${org}`);

    heartbeatInterval = setInterval(() => {
      if (backendWs && backendWs.readyState === WebSocket.OPEN) {
        backendWs.send(JSON.stringify({
          heartbeat: { timestamp: new Date().toISOString(), clientName: 'mm_ui', brand: 'Integral' }
        }));
      }
    }, 5000);

    broadcastToBrowsers({ type: 'ws_status', connected: true });
  });

  backendWs.on('message', (data) => {
    const msg = data.toString();
    let parsed;
    try { parsed = JSON.parse(msg); } catch (_) {}

    if (parsed?.heartbeat) return; // suppress heartbeat from console & clients

    console.log(`[WS] ← ${msg}`);
    broadcastToBrowsers({ type: 'price_data', ts: new Date().toISOString(), payload: msg });
  });

  backendWs.on('error', (err) => {
    console.error(`[WS] Backend error: ${err.message}`);
    clearInterval(heartbeatInterval);
    broadcastToBrowsers({ type: 'ws_status', connected: false, error: err.message });
  });

  backendWs.on('close', (code, reason) => {
    console.log(`[WS] Backend disconnected: ${code} ${reason}`);
    clearInterval(heartbeatInterval);
    backendWs = null;
    broadcastToBrowsers({ type: 'ws_status', connected: false });
  });
}

function disconnectBackendWs() {
  clearInterval(heartbeatInterval);
  heartbeatInterval = null;
  if (backendWs) {
    backendWs.close();
    backendWs = null;
  }
}

// ─── REST routes ───────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
  const { user, pass, org } = req.body;
  if (!user || !pass || !org) {
    return res.status(400).json({ error: 'user, pass and org are required' });
  }
  try {
    const response = await axios.post(
      LOGIN_URL,
      { user, pass, org },
      { headers: { 'CLIENT_TYPE': 'BROWSER', 'Content-Type': 'application/json' }, validateStatus: null }
    );

    if (response.status !== 200) {
      return res.status(response.status).json({ error: 'Login failed', details: response.data });
    }

    const setCookieHeader = response.headers['set-cookie'];
    let ssoToken = null;
    if (setCookieHeader) {
      for (const cookieStr of setCookieHeader) {
        const match = cookieStr.match(/SSO_TOKEN=([^;]+)/);
        if (match) { ssoToken = match[1]; break; }
      }
    }

    if (!ssoToken) {
      return res.status(401).json({ error: 'Login failed: SSO_TOKEN not received in response' });
    }

    req.session.ssoToken = ssoToken;
    req.session.user = user;
    req.session.org = org;

    // Open backend WebSocket for this session
    connectBackendWs(ssoToken, org);

    res.json({ success: true, user, org });
  } catch (err) {
    res.status(500).json({ error: 'Login request failed', details: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  disconnectBackendWs();
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/auth/status', (req, res) => {
  if (req.session.ssoToken) {
    res.json({ authenticated: true, user: req.session.user, org: req.session.org });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/api/ws/status', (req, res) => {
  res.json({
    configured: !!WS_URL,
    connected: backendWs !== null && backendWs.readyState === WebSocket.OPEN
  });
});

// Proxy: /api/proxy/marketMaker/... → API_URL_PREFIX/marketMaker/...
app.all('/api/proxy/*', async (req, res) => {
  if (!req.session.ssoToken) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  const targetPath = req.path.replace(/^\/api\/proxy/, '');
  const queryString = new URLSearchParams(req.query).toString();
  const targetUrl = `${API_URL_PREFIX}${targetPath}${queryString ? '?' + queryString : ''}`;

  const config = {
    method: req.method,
    url: targetUrl,
    headers: { 'Cookie': `SSO_TOKEN=${req.session.ssoToken}`, 'Content-Type': 'application/json', 'CLIENT_TYPE': 'BROWSER' },
    validateStatus: null
  };

  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    config.data = req.body;
  }

  console.log(`  --> ${req.method} ${targetUrl}`);
  if (config.data) {
    console.log('  REQ BODY:', JSON.stringify(config.data, null, 2).replace(/\n/g, '\n           '));
  }

  try {
    const response = await axios(config);
    console.log(`  <-- ${response.status}`);
    if (response.status === 401) delete req.session.ssoToken;
    res.status(response.status);
    if (response.data !== null && response.data !== undefined && response.data !== '') {
      res.json(response.data);
    } else {
      res.end();
    }
  } catch (err) {
    console.log(`  <-- ERROR: ${err.message}`);
    res.status(500).json({ error: 'Proxy request failed', details: err.message });
  }
});

// ─── HTTP + Browser WebSocket server ──────────────────────────────────────

const httpServer = app.listen(PORT, () => {
  console.log(`MarketMaker UI → http://localhost:${PORT}`);
  console.log(`Login URL      : ${LOGIN_URL}`);
  console.log(`API prefix     : ${API_URL_PREFIX}`);
  console.log(`WS URL         : ${WS_URL || '(not configured)'}`);
});

// Browser clients connect here to receive live price data
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (socket) => {
  console.log('[WS] Browser client connected');
  browserClients.add(socket);

  // Send current connection state immediately
  socket.send(JSON.stringify({
    type: 'ws_status',
    connected: backendWs !== null && backendWs.readyState === WebSocket.OPEN,
    configured: !!WS_URL
  }));

  socket.on('close', () => {
    console.log('[WS] Browser client disconnected');
    browserClients.delete(socket);
  });

  socket.on('error', (err) => {
    console.error(`[WS] Browser client error: ${err.message}`);
    browserClients.delete(socket);
  });
});
