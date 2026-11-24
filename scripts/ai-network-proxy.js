#!/usr/bin/env node
/**
 * keyes-ai network gate.
 *
 * Runs inside a small "gate" Docker container that is the ONLY egress path of
 * the AI devcontainer (which sits on a --internal Docker network with no
 * route to the outside world). Every HTTP/HTTPS request from the container
 * must come through this proxy.
 *
 *   - whitelisted host  -> forwarded / tunnelled silently
 *   - other host        -> the pending request is exposed on the control port
 *                          (published on the host at 127.0.0.1:3334). The
 *                          `ng-keyes` CLI long-polls it, asks the user
 *                          (session allow / permanent / deny) and posts the
 *                          decision back. No answer within the timeout => deny.
 *
 * CONNECT requests are read in plaintext (CONNECT host:443), so no TLS
 * interception / CA injection is needed: the target host is known before the
 * tunnel is opened, and afterwards the pipe stays opaque (end-to-end TLS).
 *
 * Zero dependencies (Node >= 18).
 */

'use strict';

const http = require('http');
const net = require('net');
const fs = require('fs');

const PROXY_PORT = Number(process.env.KEYES_GATE_PROXY_PORT || 3333);
const CONTROL_PORT = Number(process.env.KEYES_GATE_CONTROL_PORT || 3334);
const WHITELIST_PATH = process.env.KEYES_WHITELIST || '/run/keyes/whitelist.json';
const BLACKLIST_PATH = process.env.KEYES_BLACKLIST || '/run/keyes/blacklist.json';
const EVENTS_PATH = process.env.KEYES_EVENTS || '/run/keyes/events.jsonl';
const DECISION_TIMEOUT_MS = Number(process.env.KEYES_GATE_DECISION_TIMEOUT_MS || 30000);
const LONGPOLL_TIMEOUT_MS = 55000;

// ---------------------------------------------------------------------------
// Whitelist / blacklist
// ---------------------------------------------------------------------------

function loadHostFile(p) {
    try {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`[keyes-gate] could not read ${p}: ${err.message}`);
        }
    }
    return [];
}

function saveHostFile(p, entries) {
    fs.writeFileSync(p, JSON.stringify(entries, null, 2) + '\n');
}

let whitelist = loadHostFile(WHITELIST_PATH);
let blacklist = loadHostFile(BLACKLIST_PATH);

function addEntry(list, file, entry) {
    const clean = String(entry).trim().toLowerCase();
    if (!clean || list.includes(clean)) return false;
    const next = [...list, clean];
    if (file === WHITELIST_PATH) { whitelist = next; saveHostFile(WHITELIST_PATH, next); }
    else { blacklist = next; saveHostFile(BLACKLIST_PATH, next); }
    return true;
}

function removeEntry(list, file, entry) {
    const clean = String(entry).trim().toLowerCase();
    if (!list.includes(clean)) return false;
    const next = list.filter((e) => e !== clean);
    if (file === WHITELIST_PATH) { whitelist = next; saveHostFile(WHITELIST_PATH, next); }
    else { blacklist = next; saveHostFile(BLACKLIST_PATH, next); }
    return true;
}

/** Exact match, or `*.domain` wildcard (matches the domain itself and subdomains). */
function matchesAny(entries, host) {
    const target = String(host).toLowerCase();
    return entries.some((entry) => {
        if (entry === target) return true;
        if (entry.startsWith('*.')) {
            const base = entry.slice(2);
            return target === base || target.endsWith(`.${base}`);
        }
        return false;
    });
}

function isWhitelisted(host) {
    const target = String(host).toLowerCase();
    if (sessionAllow.has(target)) return true;
    return matchesAny(whitelist, host);
}

function isBlacklisted(host) {
    return matchesAny(blacklist, host);
}

// ---------------------------------------------------------------------------
// Event log (audit trail of every request, visible from the host)
// ---------------------------------------------------------------------------

function logEvent(entry) {
    try {
        fs.appendFile(EVENTS_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', () => {});
    } catch (err) {
        // never let logging break the gate
    }
}

// ---------------------------------------------------------------------------
// Decision flow: whitelist hit -> allow, otherwise ask the CLI (long-poll)
// ---------------------------------------------------------------------------

const sessionAllow = new Set(); // hosts allowed for the lifetime of this gate
const pending = new Map(); // id -> { info, timer, resolve }
let waiters = []; // long-poll /pending callbacks
let nextId = 1;

function logDecision(id, choice, reason) {
    logEvent({ type: 'decision', id, choice, ...(reason ? { reason } : {}) });
}

function notifyWaiters() {
    const ws = waiters;
    waiters = [];
    ws.forEach((wake) => wake());
}

function firstPending() {
    for (const item of pending.values()) return item;
    return undefined;
}

function askDecision(info) {
    return new Promise((resolve) => {
        const id = nextId++;
        logEvent({ type: 'ask', id, ...info });
        const timer = setTimeout(() => {
            pending.delete(id);
            logDecision(id, 'deny', 'timeout');
            resolve({ choice: 'deny', reason: 'timeout' });
        }, DECISION_TIMEOUT_MS);
        console.log(`[keyes-gate] decision requested: ${info.host} (id ${id})`);
        pending.set(id, {
            id,
            info,
            timer,
            resolve: (choice, reason) => {
                clearTimeout(timer);
                pending.delete(id);
                logDecision(id, choice, reason);
                resolve({ choice, reason });
            }
        });
        notifyWaiters();
    });
}

/**
 * @param {object} info
 * @param {string} info.host
 * @param {number} [info.port]
 * @param {string} info.method
 * @param {string} [info.path]   request path (HTTP) — helps explain intent
 * @param {string} [info.userAgent]
 * @param {string} [info.reason] X-Keyes-Reason header if the agent provided one
 * @returns {{decision: 'allow' | 'deny', reason?: string, by?: string}}
 */
async function gateDecision(info) {
    // A permanent deny always wins, even over an explicit whitelist.
    if (isBlacklisted(info.host)) {
        logEvent({ type: 'deny', id: 0, ...info, reason: 'permanent deny' });
        return { decision: 'deny', reason: 'permanent deny' };
    }
    const target = String(info.host).toLowerCase();
    if (sessionAllow.has(target)) {
        logEvent({ type: 'allow', id: 0, ...info, by: 'session' });
        return { decision: 'allow', by: 'session' };
    }
    if (matchesAny(whitelist, info.host)) {
        logEvent({ type: 'allow', id: 0, ...info, by: 'whitelist' });
        return { decision: 'allow', by: 'whitelist' };
    }
    const { choice, reason } = await askDecision(info);
    if (choice === 'session') {
        sessionAllow.add(target);
        return { decision: 'allow', by: 'session' };
    }
    if (choice === 'permanent') {
        addEntry(whitelist, WHITELIST_PATH, info.host);
        removeEntry(blacklist, BLACKLIST_PATH, info.host); // un-blacklist wins
        return { decision: 'allow', by: 'whitelist' };
    }
    if (choice === 'blacklist') {
        addEntry(blacklist, BLACKLIST_PATH, info.host);
        whitelist = whitelist.filter((e) => e !== target); // remove from whitelist
        saveHostFile(WHITELIST_PATH, whitelist);
        sessionAllow.delete(target);
        return { decision: 'deny', reason: 'permanent deny' };
    }
    return { decision: 'deny', reason: reason || 'denied' };
}

function denyBody(info, reason) {
    const permanent = reason === 'permanent deny';
    return (
        `403 Forbidden — keyes-ai network gate\n` +
        `\n` +
        `Request to ${info.host}${info.port ? ':' + info.port : ''} was not approved.\n` +
        `Method: ${info.method}${info.path ? '  Path: ' + info.path : ''}\n` +
        (info.reason ? `Reason: ${info.reason}\n` : '') +
        `\n` +
        (permanent
            ? `This host is permanently denied.\n` +
              `To allow it again:  ng-keyes ai network deny --remove ${info.host}\n` +
              `then  ng-keyes ai network allow ${info.host}\n`
            : `The operator was asked and denied (or did not answer in time).\n` +
              `To pre-allow this host:  ng-keyes ai network allow ${info.host}\n`)
    );
}

// ---------------------------------------------------------------------------
// Proxy (HTTP + CONNECT tunnel)
// ---------------------------------------------------------------------------

function forwardHttp(req, res, info) {
    const targetPort = Number((req.headers.host || '').split(':')[1] || 80);
    const path = info.path; // pathname + search (absolute-form stripped)
    const options = {
        host: info.host,
        port: Number.isInteger(targetPort) ? targetPort : 80,
        path,
        method: req.method,
        headers: { ...req.headers }
    };
    delete options.headers.host;
    options.headers.host = info.host;

    const upstream = http.request(options, (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
        upstreamRes.pipe(res);
    });
    upstream.on('error', (err) => {
        logEvent({ type: 'error', id: 0, ...info, error: err.message });
        if (!res.destroyed && !res.headersSent) {
            res.writeHead(502, { 'content-type': 'text/plain' });
        }
        if (!res.destroyed) {
            res.end(`502 Bad Gateway — keyes-ai network gate could not reach ${info.host}: ${err.message}\n`);
        }
    });
    req.on('error', () => {}); // client reset must never take the gate down
    req.pipe(upstream);
}

const proxyServer = http.createServer((req, res) => {
    let host = (req.headers.host || '').split(':')[0];
    let path = req.url;

    // Proxy clients send an absolute URI (http://host/path); keep only the path.
    if (/^https?:\/\//i.test(req.url)) {
        const parsed = new URL(req.url);
        host = parsed.hostname || host;
        path = parsed.pathname + parsed.search || '/';
    }

    const info = {
        host,
        port: 80,
        method: req.method,
        path,
        userAgent: req.headers['user-agent'],
        reason: req.headers['x-keyes-reason']
    };

    gateDecision(info).then(({ decision, reason }) => {
        if (decision === 'deny') {
            res.writeHead(403, { 'content-type': 'text/plain' });
            res.end(denyBody(info, reason));
            return;
        }
        forwardHttp(req, res, info);
    });
});

proxyServer.on('connect', (req, clientSocket, head) => {
    const [host, portStr] = (req.url || '').split(':');
    const port = Number(portStr) || 443;
    const info = {
        host,
        port,
        method: 'CONNECT',
        userAgent: req.headers['user-agent'],
        reason: req.headers['x-keyes-reason']
    };

    gateDecision(info).then(({ decision, reason }) => {
        if (clientSocket.destroyed) return;
        if (decision === 'deny') {
            clientSocket.write('HTTP/1.1 403 Forbidden\r\ncontent-type: text/plain\r\n\r\n' + denyBody(info, reason));
            clientSocket.end();
            return;
        }
        const upstreamSocket = net.connect(port, host);
        let connected = false;
        upstreamSocket.once('connect', () => {
            connected = true;
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            if (head && head.length) upstreamSocket.write(head);
            upstreamSocket.pipe(clientSocket);
            clientSocket.pipe(upstreamSocket);
            upstreamSocket.on('error', () => clientSocket.end());
            clientSocket.on('error', () => upstreamSocket.end());
            clientSocket.on('close', () => upstreamSocket.end());
        });
        upstreamSocket.on('error', (err) => {
            if (connected) return;
            logEvent({ type: 'error', id: 0, ...info, error: err.message });
            if (!clientSocket.destroyed) {
                clientSocket.write('HTTP/1.1 502 Bad Gateway\r\ncontent-type: text/plain\r\n\r\n' +
                    `Could not reach ${host}:${port}: ${err.message}\n`);
                clientSocket.end();
            }
        });
    });
    clientSocket.on('error', () => {}); // peer reset must never take the gate down
});

// ---------------------------------------------------------------------------
// Control API (CLI side, published on the host at 127.0.0.1:3334)
// ---------------------------------------------------------------------------

function sendJson(res, status, body) {
    const data = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(data);
}

const controlServer = http.createServer((req, res) => {
    const parsed = new URL(req.url, 'http://control');

    if (req.method === 'GET' && parsed.pathname === '/pending') {
        const first = firstPending();
        if (first) {
            return sendJson(res, 200, { id: first.id, ...first.info });
        }
        // long-poll: hold the request until a decision is asked or the timeout
        const to = setTimeout(() => {
            const idx = waiters.indexOf(wake);
            if (idx !== -1) waiters.splice(idx, 1);
            res.writeHead(204);
            res.end();
        }, LONGPOLL_TIMEOUT_MS);
        const wake = () => {
            const idx = waiters.indexOf(wake);
            if (idx !== -1) waiters.splice(idx, 1);
            clearTimeout(to);
            const firstNow = firstPending();
            if (firstNow) {
                sendJson(res, 200, { id: firstNow.id, ...firstNow.info });
            } else {
                res.writeHead(204);
                res.end();
            }
        };
        waiters.push(wake);
        return;
    }

    if (req.method === 'POST' && parsed.pathname === '/decide') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
            try {
                const { id, choice } = JSON.parse(body || '{}');
                const item = pending.get(id);
                if (!item) return sendJson(res, 404, { error: 'unknown or already resolved request id' });
                if (!['session', 'permanent', 'deny', 'blacklist'].includes(choice)) {
                    return sendJson(res, 400, { error: 'choice must be session, permanent, deny or blacklist' });
                }
                item.resolve(choice);
                sendJson(res, 200, { ok: true });
            } catch (err) {
                sendJson(res, 400, { error: err.message });
            }
        });
        return;
    }

    if (req.method === 'POST' && parsed.pathname === '/whitelist') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
            try {
                const { hosts, remove = false } = JSON.parse(body || '{}');
                if (!Array.isArray(hosts)) return sendJson(res, 400, { error: 'hosts must be an array' });
                const changed = hosts.map((h) => (remove ? removeEntry : addEntry)(whitelist, WHITELIST_PATH, h)).filter(Boolean);
                if (!remove) {
                    // An explicit allow lifts the permanent deny (blacklist).
                    hosts.forEach((h) => { removeEntry(blacklist, BLACKLIST_PATH, h); });
                }
                logEvent({ type: 'whitelist', action: remove ? 'remove' : 'add', changed, all: whitelist });
                sendJson(res, 200, { changed, all: whitelist, blacklist: blacklist });
            } catch (err) {
                sendJson(res, 400, { error: err.message });
            }
        });
        return;
    }

    if (req.method === 'POST' && parsed.pathname === '/blacklist') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
            try {
                const { hosts, remove = false } = JSON.parse(body || '{}');
                if (!Array.isArray(hosts)) return sendJson(res, 400, { error: 'hosts must be an array' });
                const changed = hosts.map((h) => (remove ? removeEntry : addEntry)(blacklist, BLACKLIST_PATH, h)).filter(Boolean);
                logEvent({ type: 'blacklist', action: remove ? 'remove' : 'add', changed, all: blacklist });
                sendJson(res, 200, { changed, all: blacklist });
            } catch (err) {
                sendJson(res, 400, { error: err.message });
            }
        });
        return;
    }

    if (req.method === 'GET' && parsed.pathname === '/health') {
        let hosts = {};
        try { hosts = JSON.parse(process.env.KEYES_GATE_HOSTS || '{}'); } catch (err) { /* invalid mapping */ }
        return sendJson(res, 200, { ok: true, whitelist, blacklist, session: [...sessionAllow], pending: pending.size, ca: process.env.NODE_EXTRA_CA_CERTS || null, hosts });
    }

    sendJson(res, 404, { error: 'not found' });
});

proxyServer.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

proxyServer.listen(PROXY_PORT, '0.0.0.0', () => {
    console.log(`[keyes-gate] proxy listening on :${PROXY_PORT}`);
});
controlServer.listen(CONTROL_PORT, '0.0.0.0', () => {
    console.log(`[keyes-gate] control listening on :${CONTROL_PORT}`);
});

// The gate is the last line of defense: an unexpected error must be logged,
// never take the process down (and never let a request through).
process.on('uncaughtException', (err) => {
    console.error('[keyes-gate] uncaught exception:', err.message);
});
process.on('unhandledRejection', (err) => {
    console.error('[keyes-gate] unhandled rejection:', err && err.message);
});
