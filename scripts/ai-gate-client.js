// keyes-ai network gate client: one gate container per project (named and
// control port derived from the project path hash). Talks to the gate over
// its control port (published on 127.0.0.1) and manages its lifecycle.
const { spawnSync } = require('child_process');
const fse = require('fs-extra');
const { join } = require('path');
const { colors } = require('../theme');

const NETWORK_NAME = 'keyes-ai-net';
const NETWORK_EGRESS = 'keyes-ai-egress';
const GATE_IMAGE = process.env.KEYES_GATE_IMAGE || 'keyes-ai-gate:latest';
const GATE_PROXY_PORT = 3333; // port of the proxy inside the network
const GATE_DOCKERFILE_DIR = join(__dirname, '..', 'templates', 'gate');

// One gate per project, so parallel devcontainers each keep their own
// whitelist. Name and control port are derived from an absolute path hash
// (control ports use an ephemeral-style range, never a fixed port).
const { createHash } = require('crypto');
const { resolve } = require('path');
const pathHash = (currentPath) =>
    createHash('md5').update(resolve(currentPath)).digest('hex');
const gateContainerName = (currentPath) => 'keyes-ai-gate-' + pathHash(currentPath).slice(0, 8);
// Per-project alias on the shared internal network: each devcontainer only
// resolves ITS OWN gate (aliases are network-scoped, so two containers can
// coexist on the same network without DNS ambiguity).
const gateAlias = (currentPath) => 'keyes-ai-gate-' + pathHash(currentPath).slice(8, 12);
const gateHostPort = (currentPath) => 3340 + (parseInt(pathHash(currentPath).slice(12, 16), 16) % 60);

const controlBase = (currentPath) => `http://127.0.0.1:${gateHostPort(currentPath)}`;

const docker = (args) => spawnSync('docker', args, { stdio: 'ignore' });

const containerId = (name) => {
    const out = spawnSync('docker', ['ps', '-aq', '--filter', `name=^${name}$`], { encoding: 'utf8' }).stdout;
    return out.trim().split('\n').filter(Boolean)[0] || null;
};

const gateNetworkDir = (currentPath) => join(currentPath, '.devcontainer', 'network');
const gateWhitelistPath = (currentPath) => join(gateNetworkDir(currentPath), 'whitelist.json');
const gateBlacklistPath = (currentPath) => join(gateNetworkDir(currentPath), 'blacklist.json');
const gateEventsPath = (currentPath) => join(gateNetworkDir(currentPath), 'events.jsonl');

// Corporate CA bundle: either KEYES_CA_BUNDLE=/path/to/ca.pem or a per-project
// .devcontainer/network/ca-bundle.pem. Injected into the gate (Node trust)
// and the devcontainer (system trust store) so internal hosts work.
const gateCaPath = (currentPath) => join(gateNetworkDir(currentPath), 'ca-bundle.pem');
function resolveCaBundle(currentPath) {
    const fromEnv = process.env.KEYES_CA_BUNDLE;
    if (fromEnv && fse.existsSync(fromEnv)) return fromEnv;
    const local = gateCaPath(currentPath);
    if (fse.existsSync(local)) return local;
    return null;
}

// Local name->IP mapping (VPN hosts, .local mDNS names...). The AI container
// has no upstream DNS (isolated network) and the gate must resolve the same
// names to actually reach those hosts, so both get --add-host entries.
const gateHostsPath = (currentPath) => join(gateNetworkDir(currentPath), 'hosts.json');
function resolveHosts(currentPath) {
    const fromEnv = process.env.KEYES_HOSTS_FILE;
    const path = fromEnv && fse.existsSync(fromEnv) ? fromEnv : gateHostsPath(currentPath);
    if (!fse.existsSync(path)) return {};
    try {
        const parsed = JSON.parse(fse.readFileSync(path, 'utf8'));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (err) {
        console.warn(colors.yellow(`  Ignoring invalid hosts file ${path}: ${err.message}`));
    }
    return {};
}
// [name, ip] pairs for --add-host / devcontainer "host".
const hostEntries = (currentPath) => Object.entries(resolveHosts(currentPath));

const DEFAULT_WHITELIST = [
    'registry.npmjs.org',
    'github.com',
    '*.github.com',
    'codeload.github.com',
    'objects.githubusercontent.com'
];

function ensureNetwork() {
    const existing = docker(['network', 'inspect', NETWORK_NAME]);
    if (existing.status !== 0) {
        const created = docker(['network', 'create', '--internal', NETWORK_NAME]);
        if (created.status !== 0) {
            throw new Error(`Could not create the isolated Docker network "${NETWORK_NAME}".`);
        }
        console.log(colors.gray(`  Created isolated network ${NETWORK_NAME} (no route to the outside).`));
    }
    // The gate also needs a second, normal network so it can reach the
    // outside (it is the devcontainer's only egress path).
    const egress = docker(['network', 'inspect', NETWORK_EGRESS]);
    if (egress.status !== 0) {
        const created = docker(['network', 'create', NETWORK_EGRESS]);
        if (created.status !== 0) {
            throw new Error(`Could not create the egress Docker network "${NETWORK_EGRESS}".`);
        }
        console.log(colors.gray(`  Created egress network ${NETWORK_EGRESS} (used only by the gate).`));
    }
}

function ensureWhitelist(currentPath) {
    fse.ensureDirSync(gateNetworkDir(currentPath));
    const path = gateWhitelistPath(currentPath);
    if (!fse.existsSync(path)) {
        fse.writeJsonSync(path, DEFAULT_WHITELIST, { spaces: 2 });
        console.log(colors.gray(`  Default whitelist written to ${path} (edit before starting to tweak).`));
        return true;
    }
    return false;
}

/** Permanent deny list: these hosts are always refused (never prompted). */
function ensureBlacklist(currentPath) {
    fse.ensureDirSync(gateNetworkDir(currentPath));
    const path = gateBlacklistPath(currentPath);
    if (!fse.existsSync(path)) {
        fse.writeJsonSync(path, [], { spaces: 2 });
    }
    return false;
}

function startGate(currentPath, proxyScript) {
    const name = gateContainerName(currentPath);
    // One-time migration: remove the legacy single shared gate.
    const legacy = containerId('keyes-ai-gate');
    if (legacy) {
        console.log(colors.gray('  Removing legacy shared gate (replaced by per-project gates)...'));
        spawnSync('docker', ['rm', '-f', legacy], { stdio: 'ignore' });
    }
    const existing = containerId(name);
    if (existing) {
        console.log(colors.gray(`  Restarting existing gate container...`));
        spawnSync('docker', ['rm', '-f', existing], { stdio: 'ignore' });
    }
    // Build the gate image once (node:20-alpine cached).
    const built = spawnSync('docker', ['build', '-q', '-f', join(GATE_DOCKERFILE_DIR, 'Dockerfile'), '-t', GATE_IMAGE, GATE_DOCKERFILE_DIR], { encoding: 'utf8' });
    if (built.status !== 0) {
        throw new Error(`Could not build the gate image (${GATE_IMAGE}):\n${built.stderr || built.stdout}`);
    }
    // The gate must reach the outside (egress network, for the control port
    // and its own egress) AND the devcontainer (internal network). The
    // internal network is attached AFTER the run with a per-project alias:
    // "docker run --network net:alias" is not supported by older Docker.
    const args = [
        'run', '-d',
        '--name', name,
        '--network', NETWORK_EGRESS,
        '-p', `127.0.0.1:${gateHostPort(currentPath)}:3334`,
        '-v', `${gateNetworkDir(currentPath)}:/run/keyes`,
        '-v', `${proxyScript}:/keyes/ai-network-proxy.js:ro`,
    ];
    const caBundle = resolveCaBundle(currentPath);
    if (caBundle) {
        args.push('-e', 'NODE_EXTRA_CA_CERTS=/run/keyes/ca-bundle.pem');
        if (fse.realpathSync(caBundle) !== fse.realpathSync(gateCaPath(currentPath))) {
            // Host-side bundle (KEYES_CA_BUNDLE): mount it at the expected path.
            args.push('-v', `${caBundle}:/run/keyes/ca-bundle.pem:ro`);
        }
        console.log(colors.gray(`  Gate will trust the corporate CA bundle: ${caBundle}`));
    }
    // Name resolution: the gate resolves VPN/local names to the same IPs.
    const hosts = resolveHosts(currentPath);
    for (const [name, ip] of Object.entries(hosts)) {
        args.push('--add-host', `${name}:${ip}`);
    }
    if (Object.keys(hosts).length) {
        args.push('-e', `KEYES_GATE_HOSTS=${JSON.stringify(hosts)}`);
    }
    args.push(GATE_IMAGE);
    const started = spawnSync('docker', args, { encoding: 'utf8' });
    if (started.status !== 0) {
        throw new Error(`Could not start the gate container:\n${started.stderr || started.stdout}`);
    }
    // Attach the internal network with the per-project alias so the
    // devcontainer resolves only its own gate (aliases are network-scoped).
    const attached = spawnSync('docker', ['network', 'connect', '--alias', gateAlias(currentPath), NETWORK_NAME, name], { encoding: 'utf8' });
    if (attached.status !== 0) {
        spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
        throw new Error(`Could not attach the gate to ${NETWORK_NAME}:\n${attached.stderr || attached.stdout}`);
    }
    console.log(colors.gray(`  Gate container started (control on 127.0.0.1:${gateHostPort(currentPath)}).`));
}

async function waitGateHealthy(currentPath, retries = 40) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(controlBase(currentPath) + '/health');
            if (res.ok) return res.json();
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`The gate container did not become healthy in time. Check: docker logs ${gateContainerName(currentPath)}`);
}

const isGateHealthy = async (currentPath) => {
    try {
        const res = await fetch(controlBase(currentPath) + '/health', { signal: AbortSignal.timeout(1500) });
        return res.ok;
    } catch {
        return false;
    }
};

const getGateStatus = async (currentPath) => {
    try {
        const res = await fetch(controlBase(currentPath) + '/health', { signal: AbortSignal.timeout(1500) });
        return res.ok ? res.json() : null;
    } catch {
        return null;
    }
};

/** Long-poll for the next pending network request (or null on timeout). */
const nextPending = async (currentPath, signal) => {
    try {
        const res = await fetch(controlBase(currentPath) + '/pending', {
            signal: signal || AbortSignal.timeout(56000)
        });
        if (res.status === 204) return null;
        return res.json();
    } catch {
        return null;
    }
};

const postDecision = async (currentPath, id, choice) => {
    const res = await fetch(controlBase(currentPath) + '/decide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, choice })
    });
    return res.ok;
};

const postWhitelist = async (currentPath, hosts, remove = false) => {
    const res = await fetch(controlBase(currentPath) + '/whitelist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hosts, remove })
    });
    return res.ok ? res.json() : null;
};

const postBlacklist = async (currentPath, hosts, remove = false) => {
    const res = await fetch(controlBase(currentPath) + '/blacklist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hosts, remove })
    });
    return res.ok ? res.json() : null;
};

function stopGate(currentPath) {
    const id = containerId(gateContainerName(currentPath));
    if (id) {
        spawnSync('docker', ['rm', '-f', id], { stdio: 'ignore' });
        console.log(colors.gray('  Gate container stopped.'));
    }
}

/**
 * Interactive decision loop: long-polls the gate, shows each pending network
 * request and reads the operator's answer (s/p/n, default: deny).
 * @param {number} maxDurationMs 0 = run forever (until Ctrl+C)
 */
function decisionLoop(currentPath, maxDurationMs = 0) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Suppress readline's default "> " prompt; we print our own question.
    rl.setPrompt('');
    rl.prompt();

    // Buffer answers: input that arrives before the next prompt (e.g. piped
    // input, or a fast operator) must not be dropped.
    const answers = [];
    let waiting = null;
    let running = true;
    let explicitClose = false;
    const abort = new AbortController();
    rl.on('close', () => {
        // stdin EOF closes readline automatically; only an explicit
        // rl.close() (operator done) stops the loop.
        if (!explicitClose) return;
        running = false;
        abort.abort(); // interrupt the in-flight long-poll so the process can exit
    });
    rl.on('line', (line) => {
        if (waiting) {
            const resolve = waiting;
            waiting = null;
            resolve(line);
        } else {
            answers.push(line);
        }
    });
    const ask = (q) => new Promise((resolve) => {
        process.stdout.write(q);
        if (answers.length) resolve(answers.shift());
        else waiting = resolve;
    });
    const deadline = maxDurationMs ? Date.now() + maxDurationMs : Infinity;

    const close = () => {
        explicitClose = true;
        running = false;
        abort.abort();
        try { rl.close(); } catch { /* already closed */ }
    };

    (async () => {
        while (running && Date.now() < deadline) {
            const item = await nextPending(currentPath, abort.signal);
            if (!item) continue;
            if (!running) break;
            const target = `${item.host}${item.port ? ':' + item.port : ''}`;
            console.log('');
            console.log(colors.yellow(`\u26a0 [keyes-gate] network request #${item.id} : ${colors.cyan(target)}`));
            console.log(colors.gray(`    ${item.method}${item.path ? ' ' + item.path : ''}`));
            if (item.reason) console.log(colors.gray(`    reason: ${item.reason}`));
            if (item.userAgent) console.log(colors.gray(`    client: ${item.userAgent}`));
            console.log('   ' + colors.green('s') + '=allow this session   ' + colors.green('p') + '=whitelist permanently   ' + colors.red('n') + '=deny   ' + colors.red('d') + '=deny permanently (blacklist)');
            const answer = (await ask('   choice [s/p/n/d] > ')).trim().toLowerCase();
            const choice = answer === 's' ? 'session' : answer === 'p' ? 'permanent' : answer === 'd' ? 'blacklist' : 'deny';
            const ok = await postDecision(currentPath, item.id, choice);
            if (ok) {
                console.log(colors.green(`   -> ${choice}`));
                if (choice === 'permanent') {
                    console.log(colors.gray(`      ${item.host} added to ${gateWhitelistPath(currentPath)}`));
                } else if (choice === 'blacklist') {
                    console.log(colors.gray(`      ${item.host} permanently denied (${gateBlacklistPath(currentPath)})`));
                }
            } else if (choice === 'permanent' || choice === 'blacklist') {
                // The request already timed out on the gate side (30s) and was
                // denied — but the user's intent must still stick for future
                // requests. Apply it through the list APIs (live gate) or the
                // file (gate offline).
                const live = await getGateStatus(currentPath);
                if (live && live.ok) {
                    if (choice === 'blacklist') await postBlacklist(currentPath, [item.host]);
                    else await postWhitelist(currentPath, [item.host]);
                } else {
                    const listPath = choice === 'blacklist' ? gateBlacklistPath(currentPath) : gateWhitelistPath(currentPath);
                    const list = fse.existsSync(listPath) ? fse.readJsonSync(listPath) : [];
                    if (!list.includes(item.host)) fse.writeJsonSync(listPath, [...list, item.host], { spaces: 2 });
                }
                console.log(colors.yellow(`   -> request had already timed out (denied); ${item.host} ${choice === 'blacklist' ? 'is now permanently denied' : 'is now whitelisted'} for future requests.`));
            } else {
                console.log(colors.red('   -> could not deliver the decision (gate offline?)'));
            }
        }
    })().catch(() => close());

    return { close };
}

module.exports = {
    NETWORK_NAME,
    GATE_PROXY_PORT,
    gateContainerName,
    gateHostPort,
    gateAlias,
    resolveCaBundle,
    resolveHosts,
    hostEntries,
    gateHostsPath,
    gateWhitelistPath,
    gateBlacklistPath,
    gateEventsPath,
    ensureNetwork,
    ensureWhitelist,
    ensureBlacklist,
    startGate,
    waitGateHealthy,
    isGateHealthy,
    getGateStatus,
    nextPending,
    postDecision,
    postWhitelist,
    postBlacklist,
    stopGate,
    decisionLoop
};
