'use strict';

// ─── Body Templates ───────────────────────────────────────────────────────────
const T = {
  brokerConfig: {
    organization: '',
    currencyPairs: [],
    pricingEnabled: true
  },
  corePricing: {
    organization: '',
    currencyPair: '',
    pricingMode: 'AUTO',
    midRate: 1.1234,
    bidOfferSpread: 0.0002,
    asymmetricSkew: false,
    skew: 0.0,
    skewMode: 'AUTO',
    bidSkew: 0.0,
    offerSkew: 0.0,
    pricingEnabled: true,
    aggregationStrategy: 'BestPriceMidRate',
    aggregationMode: 'MANUAL',
    executionMode: 'NoCover'
  },
  providerConfig: {
    organization: '',
    currencyPair: '',
    providers: [{ name: '', status: true }]
  },
  providerMeta: { name: '', status: true },
  streamPricingConfig: {
    organization: '',
    currencyPair: '',
    streams: [{
      name: '',
      hourglassPricingSupported: false,
      status: true,
      tiers: [{ tierId: 1, minSpread: 0, maxSpread: 0, bidSpread: 0, offerSpread: 0, spreadType: 'PIPS', limit: 1000000 }]
    }]
  },
  streamMeta: {
    name: '',
    hourglassPricingSupported: false,
    status: true,
    tiers: [{ tierId: 1, minSpread: 0, maxSpread: 0, bidSpread: 0, offerSpread: 0, spreadType: 'PIPS', limit: 1000000 }]
  },
  tierPricingConfig: {
    organization: '',
    currencyPair: '',
    tiers: [{ tierAmount: 1000000, bidOfferSpread: 0, bidSpread: 0, offerSpread: 0, missingPriceSpread: 0 }],
    minSpreadEnabled: false,
    volatilityEnabled: false,
    volatilitySpreadMultiplier: 1.0,
    useMultiplierFromService: false,
    missingPriceCalculationEnabled: false
  },
  fwdPointsConfig: {
    organization: '',
    currencyPair: '',
    mode: '',
    currency1Primary: true,
    spotRate: 1.1234,
    tenors: [{ tenor: '1M', mode: '', bid: 0, offer: 0, mid: 0, spread: 0, skew: 0, interestRate1: 0, interestRate2: 0 }]
  },
  tenorMeta: {
    tenor: '',
    mode: '',
    bid: 0,
    offer: 0,
    mid: 0,
    spread: 0,
    skew: 0,
    interestRate1: 0,
    interestRate2: 0
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
let sessionOrg = '';
let ctxBase = '';
let ctxTerm = '';

function getCtx() { return { org: sessionOrg, base: ctxBase, term: ctxTerm }; }

function updateCtxFromInput() {
  const raw = (document.getElementById('ctx-ccy-pair')?.value || '').trim().toUpperCase();
  const parts = raw.includes('/') ? raw.split('/') : raw.split(/\s+/);
  ctxBase = (parts[0] || '').trim();
  ctxTerm = (parts[1] || '').trim();
}

// ─── Section / Resource Config ────────────────────────────────────────────────
const SECTIONS = {
  broker: {
    title: 'Broker Configuration',
    resources: [
      {
        id: 'config',
        title: 'Broker Config',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}`,
        params: [],
        methods: { GET: {}, POST: { bodyKey: 'brokerConfig' }, PUT: { bodyKey: 'brokerConfig' }, DELETE: {} }
      },
      {
        id: 'ccy-pair',
        title: 'Currency Pair',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}/currencyPairs/${c.base}/${c.term}`,
        params: [],
        methods: { POST: {}, DELETE: {} }
      }
    ]
  },
  pricing: {
    title: 'Core Pricing',
    liveKey: 'mmCorePriceData',
    resources: [
      {
        id: 'all',
        title: 'All Pricing (Broker)',
        pathFn: (p, c) => `/marketMaker/pricing/${c.org}`,
        params: [],
        methods: { GET: {} }
      },
      {
        id: 'pair',
        title: 'Pricing Config',
        pathFn: (p, c) => `/marketMaker/pricing/${c.org}/currencyPairs/${c.base}/${c.term}`,
        params: [],
        methods: { GET: {}, POST: { bodyKey: 'corePricing' }, PUT: { bodyKey: 'corePricing' }, DELETE: {} }
      }
    ]
  },
  providers: {
    title: 'Provider Configuration',
    resources: [
      {
        id: 'broker-all',
        title: 'All Providers (Broker)',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}/providers`,
        params: [],
        methods: { GET: {} }
      },
      {
        id: 'names',
        title: 'Provider Names',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}/providers/names`,
        params: [],
        methods: { GET: {} }
      },
      {
        id: 'pair',
        title: 'Providers (CCY Pair)',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}/currencyPairs/${c.base}/${c.term}/providers`,
        params: [],
        methods: { GET: {}, POST: { bodyKey: 'providerConfig' }, PUT: { bodyKey: 'providerConfig' }, DELETE: {} }
      },
      {
        id: 'provider',
        title: 'Single Provider',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}/currencyPairs/${c.base}/${c.term}/providers/${p.providerOrg}`,
        params: [{ id: 'providerOrg', label: 'Provider Org', placeholder: 'e.g. LP1' }],
        methods: { POST: { bodyKey: 'providerMeta' }, DELETE: {} }
      },
      {
        id: 'provider-status',
        title: 'Provider Status',
        pathFn: (p, c) => `/marketMaker/broker-configurations/${c.org}/currencyPairs/${c.base}/${c.term}/providers/${p.providerOrg}/status`,
        params: [{ id: 'providerOrg', label: 'Provider Org', placeholder: 'e.g. LP1' }],
        methods: { PUT: { bodyKey: 'providerMeta' } }
      }
    ]
  },
  streamprices: {
    title: 'Stream Pricing',
    resources: [
      {
        id: 'config',
        title: 'Stream Config',
        pathFn: (p, c) => `/marketMaker/streamprices/${c.org}/currencyPairs/${c.base}/${c.term}`,
        params: [],
        methods: { GET: {}, POST: { bodyKey: 'streamPricingConfig' }, PUT: { bodyKey: 'streamPricingConfig' }, DELETE: {} }
      },
      {
        id: 'stream',
        title: 'Single Stream',
        pathFn: (p, c) => `/marketMaker/streamprices/${c.org}/currencyPairs/${c.base}/${c.term}/streams/${p.streamName}`,
        params: [{ id: 'streamName', label: 'Stream Name', placeholder: 'e.g. STREAM1' }],
        methods: { PUT: { bodyKey: 'streamMeta' }, DELETE: {} }
      }
    ]
  },
  tierprices: {
    title: 'Tier Pricing',
    liveKey: 'mmTieredPriceData',
    resources: [
      {
        id: 'config',
        title: 'Tier Config',
        pathFn: (p, c) => `/marketMaker/tierprices/${c.org}/currencyPairs/${c.base}/${c.term}`,
        params: [],
        methods: { GET: {}, POST: { bodyKey: 'tierPricingConfig' }, PUT: { bodyKey: 'tierPricingConfig' }, DELETE: {} }
      }
    ]
  },
  forwardpoints: {
    title: 'Forward Points',
    liveKey: 'forwardPointsData',
    resources: [
      {
        id: 'config',
        title: 'Forward Points Config',
        pathFn: (p, c) => `/marketMaker/forwardpoints/${c.org}/currencyPairs/${c.base}/${c.term}`,
        params: [],
        methods: { GET: {}, POST: { bodyKey: 'fwdPointsConfig' }, PUT: { bodyKey: 'fwdPointsConfig' }, DELETE: {} }
      },
      {
        id: 'tenor',
        title: 'Tenor',
        pathFn: (p, c) => `/marketMaker/forwardpoints/${c.org}/currencyPairs/${c.base}/${c.term}/tenors/${p.tenorName}`,
        params: [{ id: 'tenorName', label: 'Tenor', placeholder: 'e.g. 1M' }],
        methods: { PUT: { bodyKey: 'tenorMeta' } }
      }
    ]
  }
};

// ─── Active method state ──────────────────────────────────────────────────────
const activeMethod = {};

function getActiveMethod(sectionId, resId) {
  const key = `${sectionId}-${resId}`;
  return activeMethod[key] ||
    Object.keys(SECTIONS[sectionId].resources.find(r => r.id === resId).methods)[0];
}

// ─── Array row helpers ────────────────────────────────────────────────────────
const ARRAY_TEMPLATES = {};

function isSimpleFlatArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const item = arr[0];
  return item && typeof item === 'object' && !Array.isArray(item) &&
    Object.values(item).every(v => v === null || typeof v !== 'object');
}

function renderArrayRowHtml(containerId, template) {
  const cells = Object.entries(template).map(([key, defVal]) => {
    if (typeof defVal === 'boolean') {
      return `<div class="array-cell"><label>${key}</label>
        <select data-field="${key}">
          <option value="true"${defVal ? ' selected' : ''}>true</option>
          <option value="false"${!defVal ? ' selected' : ''}>false</option>
        </select></div>`;
    }
    const type = typeof defVal === 'number' ? 'number' : 'text';
    const step = type === 'number' ? ' step="any"' : '';
    return `<div class="array-cell"><label>${key}</label>
      <input type="${type}"${step} data-field="${key}" value="${defVal ?? ''}"></div>`;
  }).join('');
  return `<div class="array-row">${cells}
    <button type="button" class="btn-rm-row" onclick="this.closest('.array-row').remove()">×</button></div>`;
}

function addArrayRow(containerId) {
  const tmpl = ARRAY_TEMPLATES[containerId];
  const rowsEl = document.getElementById(`${containerId}-rows`);
  if (tmpl && rowsEl) rowsEl.insertAdjacentHTML('beforeend', renderArrayRowHtml(containerId, tmpl));
}

function collectArrayRows(containerId) {
  const tmpl = ARRAY_TEMPLATES[containerId];
  const rowsEl = document.getElementById(`${containerId}-rows`);
  if (!tmpl || !rowsEl) return [];
  return Array.from(rowsEl.querySelectorAll('.array-row')).map(row => {
    const item = {};
    for (const [key, defVal] of Object.entries(tmpl)) {
      const input = row.querySelector(`[data-field="${key}"]`);
      if (!input) continue;
      if (typeof defVal === 'number') item[key] = parseFloat(input.value) || 0;
      else if (typeof defVal === 'boolean') item[key] = input.value === 'true';
      else item[key] = input.value;
    }
    return item;
  });
}

// ─── Form rendering ───────────────────────────────────────────────────────────
const CTX_FIELDS = new Set(['organization', 'currencyPair']);

function renderFormFields(tmplKey, prefix) {
  const template = T[tmplKey];
  let primitives = '';
  let arrays = '';

  for (const [key, val] of Object.entries(template)) {
    if (CTX_FIELDS.has(key)) continue;
    if (Array.isArray(val)) {
      const cid = `${prefix}-${key}`;
      if (isSimpleFlatArray(val)) {
        ARRAY_TEMPLATES[cid] = val[0];
        arrays += `<div class="array-section">
          <div class="array-header">
            <span class="array-label">${key}</span>
            <button type="button" class="btn-add-row" onclick="addArrayRow('${cid}')">+ Row</button>
          </div>
          <div id="${cid}-rows">${renderArrayRowHtml(cid, val[0])}</div>
        </div>`;
      } else {
        arrays += `<div class="array-section">
          <div class="array-header">
            <span class="array-label">${key}</span>
            <span class="array-hint">JSON</span>
          </div>
          <textarea id="${cid}" class="json-textarea" rows="5">${JSON.stringify(val, null, 2)}</textarea>
        </div>`;
      }
    } else if (typeof val === 'boolean') {
      primitives += `<div class="form-field"><label>${key}</label>
        <select id="${prefix}-${key}">
          <option value="true"${val ? ' selected' : ''}>true</option>
          <option value="false"${!val ? ' selected' : ''}>false</option>
        </select></div>`;
    } else if (typeof val === 'number') {
      primitives += `<div class="form-field"><label>${key}</label>
        <input type="number" step="any" id="${prefix}-${key}" value="${val}"></div>`;
    } else {
      primitives += `<div class="form-field"><label>${key}</label>
        <input type="text" id="${prefix}-${key}" value="${String(val)}"></div>`;
    }
  }

  return (primitives ? `<div class="form-grid">${primitives}</div>` : '') + arrays;
}

function collectFormData(tmplKey, prefix, ctx) {
  const template = T[tmplKey];
  const result = {};
  if ('organization' in template) result.organization = ctx.org;
  if ('currencyPair' in template) result.currencyPair = `${ctx.base}/${ctx.term}`;
  for (const [key, defVal] of Object.entries(template)) {
    if (CTX_FIELDS.has(key)) continue;
    if (Array.isArray(defVal)) {
      const cid = `${prefix}-${key}`;
      if (isSimpleFlatArray(defVal)) {
        result[key] = collectArrayRows(cid);
      } else {
        const el = document.getElementById(cid);
        try { result[key] = el ? JSON.parse(el.value) : defVal; } catch { result[key] = defVal; }
      }
    } else if (typeof defVal === 'boolean') {
      const el = document.getElementById(`${prefix}-${key}`);
      result[key] = el ? el.value === 'true' : defVal;
    } else if (typeof defVal === 'number') {
      const el = document.getElementById(`${prefix}-${key}`);
      result[key] = el ? (parseFloat(el.value) ?? defVal) : defVal;
    } else {
      const el = document.getElementById(`${prefix}-${key}`);
      result[key] = el ? el.value : defVal;
    }
  }
  return result;
}

function populateForm(tmplKey, prefix, data) {
  const template = T[tmplKey];
  for (const [key, defVal] of Object.entries(template)) {
    if (CTX_FIELDS.has(key) || !(key in data)) continue;
    const val = data[key];
    if (Array.isArray(defVal)) {
      const cid = `${prefix}-${key}`;
      if (isSimpleFlatArray(defVal) && Array.isArray(val)) {
        const rowsEl = document.getElementById(`${cid}-rows`);
        if (rowsEl) {
          rowsEl.innerHTML = '';
          const tmpl = ARRAY_TEMPLATES[cid] || defVal[0];
          val.forEach(item => {
            rowsEl.insertAdjacentHTML('beforeend', renderArrayRowHtml(cid, tmpl));
            const row = rowsEl.lastElementChild;
            for (const col of Object.keys(tmpl)) {
              const input = row.querySelector(`[data-field="${col}"]`);
              if (input && item[col] !== undefined) input.value = item[col];
            }
          });
        }
      } else {
        const el = document.getElementById(cid);
        if (el) el.value = JSON.stringify(val, null, 2);
      }
    } else {
      const el = document.getElementById(`${prefix}-${key}`);
      if (el && val !== undefined) el.value = val;
    }
  }
}

// ─── Response display ─────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isFlat(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.values(obj).every(v => v === null || typeof v !== 'object');
}

function renderTable(obj) {
  const rows = Object.entries(obj).map(([k, v]) =>
    `<tr><td class="tbl-key">${escHtml(k)}</td><td class="tbl-val">${
      v === null ? '<em style="color:#999">null</em>' : escHtml(String(v))
    }</td></tr>`
  ).join('');
  return `<table class="resp-table"><tbody>${rows}</tbody></table>`;
}

function showResourceResponse(key, data, status, method) {
  const el = document.getElementById(`resp-${key}`);
  if (!el) return;
  const ok = status >= 200 && status < 300;
  const badge = status
    ? `<span class="status-badge ${ok ? 's-ok' : 's-err'}">HTTP ${status}</span>`
    : `<span class="status-badge s-err">Error</span>`;
  const mBadge = method
    ? `<span class="method-badge m-${method.toLowerCase()}">${method}</span>`
    : '';
  let body;
  if (data === null || data === undefined) {
    body = '<span style="color:#27ae60;font-weight:600">204 No Content — Success</span>';
  } else if (isFlat(data)) {
    body = renderTable(data);
  } else if (typeof data === 'object') {
    body = `<pre class="resp-pre">${escHtml(JSON.stringify(data, null, 2))}</pre>`;
  } else {
    body = `<pre class="resp-pre">${escHtml(String(data))}</pre>`;
  }
  el.innerHTML = `<div class="resp-header">${mBadge}${badge}</div>${body}`;
}

// ─── Section rendering ────────────────────────────────────────────────────────
function getResourceBodyKey(resCfg) {
  for (const m of Object.values(resCfg.methods)) {
    if (m.bodyKey) return m.bodyKey;
  }
  return null;
}

function renderSection(sectionId) {
  const cfg = SECTIONS[sectionId];
  const el = document.getElementById(`section-${sectionId}`);

  const cardsHtml = cfg.resources.map(res => {
    const key = `${sectionId}-${res.id}`;
    const methodKeys = Object.keys(res.methods);
    const firstMethod = methodKeys[0];
    const bodyKey = getResourceBodyKey(res);
    const bodyPrefix = `body-${key}`;

    const paramsHtml = res.params.length
      ? `<div class="form-grid">${res.params.map(p =>
          `<div class="form-field"><label>${p.label}</label>
           <input type="text" id="${key}-${p.id}" placeholder="${p.placeholder || ''}"></div>`
        ).join('')}</div>`
      : '';

    const methodBtnsHtml = `<div class="method-btns">
      ${methodKeys.map((m, i) =>
        `<button type="button" class="method-btn m-${m.toLowerCase()}${i === 0 ? ' active' : ''}"
          onclick="selectMethod('${sectionId}','${res.id}','${m}')">${m}</button>`
      ).join('')}
    </div>`;

    const bodyFormHtml = bodyKey
      ? `<div class="body-form" id="bodyform-${key}"
            style="${res.methods[firstMethod]?.bodyKey ? '' : 'display:none'}">
          ${renderFormFields(bodyKey, bodyPrefix)}
        </div>`
      : '';

    return `<div class="resource-card" id="card-${key}">
      <div class="resource-header"><span class="resource-title">${res.title}</span></div>
      ${paramsHtml}
      ${methodBtnsHtml}
      ${bodyFormHtml}
      <button type="button" class="btn-exec" onclick="executeResource('${sectionId}','${res.id}')">Execute</button>
      <div class="resp-area" id="resp-${key}">
        <span class="resp-placeholder">No request executed yet.</span>
      </div>
    </div>`;
  }).join('');

  const liveFeedHtml = cfg.liveKey ? `
    <div class="live-feed">
      <div class="live-feed-header">
        <h3>Live — <code style="font-size:12px;color:#555">${cfg.liveKey}</code></h3>
        <span class="feed-count" id="feed-count-${sectionId}">0 messages</span>
        <button type="button" class="btn-clear-feed" onclick="clearFeed('${sectionId}')">Clear</button>
      </div>
      <div class="live-feed-entries" id="feed-${sectionId}">
        <span class="feed-placeholder">Waiting for data…</span>
      </div>
    </div>` : '';

  el.innerHTML = `
    <h2 class="section-title">${cfg.title}</h2>
    <div class="resources-grid">${cardsHtml}</div>
    ${liveFeedHtml}`;
}

// ─── Method selection ─────────────────────────────────────────────────────────
function selectMethod(sectionId, resId, method) {
  const key = `${sectionId}-${resId}`;
  activeMethod[key] = method;
  const card = document.getElementById(`card-${key}`);
  if (!card) return;
  card.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
  card.querySelector(`.method-btn.m-${method.toLowerCase()}`)?.classList.add('active');
  const resCfg = SECTIONS[sectionId].resources.find(r => r.id === resId);
  const bodyFormEl = document.getElementById(`bodyform-${key}`);
  if (bodyFormEl) bodyFormEl.style.display = resCfg.methods[method]?.bodyKey ? '' : 'none';
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function buildNav() {
  const tabsEl = document.getElementById('nav-tabs');
  Object.entries(SECTIONS).forEach(([id, cfg]) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.id = `tab-${id}`;
    btn.textContent = cfg.title;
    btn.onclick = () => showSection(id);
    tabsEl.appendChild(btn);
  });
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById(`section-${id}`)?.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${id}`)?.classList.add('active');
}

// ─── API proxy ────────────────────────────────────────────────────────────────
async function callApi(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(`/api/proxy${path}`, opts);
  let data;
  if (resp.status === 204) data = null;
  else if (resp.headers.get('content-type')?.includes('application/json')) data = await resp.json();
  else data = await resp.text();
  return { status: resp.status, data };
}

// ─── Execute ──────────────────────────────────────────────────────────────────
async function executeResource(sectionId, resId) {
  const key = `${sectionId}-${resId}`;
  const resCfg = SECTIONS[sectionId].resources.find(r => r.id === resId);
  const method = getActiveMethod(sectionId, resId);
  const methodCfg = resCfg.methods[method];

  updateCtxFromInput();
  const ctx = getCtx();

  if (!ctx.org) {
    showResourceResponse(key, { error: 'Not logged in — no session org' }, 0, method);
    return;
  }

  const params = {};
  for (const p of resCfg.params) {
    const val = document.getElementById(`${key}-${p.id}`)?.value.trim();
    if (!val) {
      showResourceResponse(key, { error: `Missing required field: ${p.label}` }, 0, method);
      return;
    }
    params[p.id] = val;
  }

  let path;
  try { path = resCfg.pathFn(params, ctx); } catch (e) {
    showResourceResponse(key, { error: `Path error: ${e.message}` }, 0, method);
    return;
  }
  if (path.includes('/undefined') || path.includes('//')) {
    showResourceResponse(key, { error: 'Missing CCY pair — enter e.g. EUR/USD in the context bar' }, 0, method);
    return;
  }

  let body;
  if (methodCfg.bodyKey) {
    body = collectFormData(methodCfg.bodyKey, `body-${key}`, ctx);
  }

  const card = document.getElementById(`card-${key}`);
  const btn = card?.querySelector('.btn-exec');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }

  try {
    const result = await callApi(method, path, body);
    showResourceResponse(key, result.data, result.status, method);

    // Auto-populate body form with GET response for easy edit → PUT
    if (method === 'GET' && result.status >= 200 && result.status < 300 &&
        result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
      const bk = getResourceBodyKey(resCfg);
      if (bk) populateForm(bk, `body-${key}`, result.data);
    }
  } catch (e) {
    showResourceResponse(key, { error: e.message }, 0, method);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Execute'; }
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function login() {
  const user  = document.getElementById('login-user').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const org   = document.getElementById('login-org').value.trim();
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  if (!user || !pass || !org) { errEl.textContent = 'All fields are required.'; return; }
  const btn = document.querySelector('.btn-login');
  btn.disabled = true; btn.textContent = 'Logging in…';
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass, org })
    });
    const data = await resp.json();
    if (resp.ok && data.success) {
      setAuthenticated(true, data.user, data.org);
      connectWebSocket();
      showSection('broker');
    } else {
      errEl.textContent = `Login failed: ${data.error || JSON.stringify(data)}`;
    }
  } catch (e) {
    errEl.textContent = `Network error: ${e.message}`;
  } finally {
    btn.disabled = false; btn.textContent = 'Login';
  }
}

async function logout() {
  disconnectWebSocket();
  await fetch('/api/logout', { method: 'POST' });
  setAuthenticated(false);
}

function setAuthenticated(auth, user, org) {
  document.getElementById('login-panel').style.display  = auth ? 'none'  : 'block';
  document.getElementById('main-content').style.display = auth ? 'block' : 'none';
  document.getElementById('ctx-bar').style.display      = auth ? 'flex'  : 'none';
  document.getElementById('nav-user').textContent       = auth ? `${user} @ ${org}` : '';
  document.getElementById('btn-logout').style.display   = auth ? 'inline-block' : 'none';
  sessionOrg = auth ? (org || '') : '';
  const orgVal = document.getElementById('ctx-org-val');
  if (orgVal) orgVal.textContent = sessionOrg || '—';
}

// ─── WebSocket client ─────────────────────────────────────────────────────────
const WS_ROUTES = {
  mmCorePriceData:   'pricing',
  mmTieredPriceData: 'tierprices',
  forwardPointsOutput: 'forwardpoints'
};
const feedCounts = {};
let wsConn = null;

function connectWebSocket() {
  if (wsConn && wsConn.readyState !== WebSocket.CLOSED) wsConn.close();
  wsConn = new WebSocket(`ws://${window.location.host}`);
  wsConn.onopen    = () => console.log('[WS] Connected to server');
  wsConn.onmessage = (e) => {
    let env;
    try { env = JSON.parse(e.data); } catch { return; }
    if (env.type === 'ws_status') updateWsStatusDot(env.connected, env.configured);
    else if (env.type === 'price_data') handlePriceData(env.ts, env.payload);
  };
  wsConn.onerror = (err) => console.error('[WS] Error:', err);
  wsConn.onclose = ()    => updateWsStatusDot(false, true);
}

function disconnectWebSocket() {
  if (wsConn) { wsConn.close(); wsConn = null; }
}

function handlePriceData(ts, payload) {
  let msg;
  try { msg = JSON.parse(payload); } catch { return; }
  for (const [key, sectionId] of Object.entries(WS_ROUTES)) {
    if (msg[key] !== undefined) { appendFeedEntry(sectionId, key, ts, msg[key]); return; }
  }
  console.log('[WS] Unrouted message:', payload);
}

function appendFeedEntry(sectionId, msgType, ts, data) {
  const feedEl = document.getElementById(`feed-${sectionId}`);
  if (!feedEl) return;
  feedEl.querySelector('.feed-placeholder')?.remove();

  const entry = document.createElement('div');
  entry.className = 'feed-entry';
  const bodyHtml = isFlat(data)
    ? renderTable(data)
    : `<pre class="feed-data">${escHtml(JSON.stringify(data, null, 2))}</pre>`;
  entry.innerHTML =
    `<span class="feed-ts">${ts}</span><span class="feed-type">${msgType}</span>${bodyHtml}`;
  feedEl.insertBefore(entry, feedEl.firstChild);
  while (feedEl.children.length > 1000) feedEl.removeChild(feedEl.lastChild);

  feedCounts[sectionId] = (feedCounts[sectionId] || 0) + 1;
  const countEl = document.getElementById(`feed-count-${sectionId}`);
  if (countEl) countEl.textContent = `${feedCounts[sectionId]} messages`;
}

function clearFeed(sectionId) {
  const el = document.getElementById(`feed-${sectionId}`);
  if (el) el.innerHTML = '<span class="feed-placeholder">Cleared — waiting for data…</span>';
  feedCounts[sectionId] = 0;
  const countEl = document.getElementById(`feed-count-${sectionId}`);
  if (countEl) countEl.textContent = '0 messages';
}

function updateWsStatusDot(connected, configured) {
  const dot   = document.getElementById('ws-dot');
  const label = document.getElementById('ws-label');
  if (!dot) return;
  dot.className = 'ws-dot';
  if (!configured) { dot.classList.add('unconfigured'); label.textContent = 'Stream (no URL)'; }
  else if (connected) { dot.classList.add('connected');    label.textContent = 'Stream live'; }
  else               { dot.classList.add('disconnected'); label.textContent = 'Stream off'; }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function init() {
  buildNav();
  Object.keys(SECTIONS).forEach(renderSection);
  ['login-user', 'login-pass', 'login-org'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  });
  try {
    const resp = await fetch('/api/auth/status');
    const data = await resp.json();
    if (data.authenticated) {
      setAuthenticated(true, data.user, data.org);
      connectWebSocket();
      showSection('broker');
    }
  } catch {}
}

init();
