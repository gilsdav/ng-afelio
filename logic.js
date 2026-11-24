// const util = require('util');
// const exec = require('child_process').exec;
const { spawn } = require('child_process');
const { colors } = require('./theme');
const fs = require('fs');
const fse = require('fs-extra');
const { join, basename, dirname } = require('path');
const { watchTree } = require('watch');

// const cli = require('@angular/cli');

// const addLocalCli = require('./scripts/add-local-cli');

// const uiKitTypes = require('./models/ui-kit-types.enum');
const config = require('./config');
const { version } = require('./package.json');
const { getConfig } = require('./scripts/check-files/util');

const currentPath = process.cwd();

// function promiseFromChildProcess(child) {
//     return new Promise(function (resolve, reject) {
//         child.stdout.pipe(process.stdout);
//         child.stderr.pipe(process.stderr);
//         child.addListener("error", reject);
//         child.addListener("exit", resolve);
//     });
// }

// pexec = (command, options) => promiseFromChildProcess(exec(command, options));

const pexec = (command, args = [], options = {}) => new Promise(function (resolve, reject) {
    // options.silent: capture output instead of inheriting stdio; errors are
    // still rejected, and stderr is attached for diagnostics on failure.
    const silent = Boolean(options.silent);
    const captured = { out: '', err: '' };
    const child = spawn(command, args, { stdio: silent ? 'pipe' : 'inherit', shell: false, ...options });
    if (silent) {
        child.stdout.on('data', (d) => { captured.out += d; });
        child.stderr.on('data', (d) => { captured.err += d; });
    }
    child.on('close', function (code) {
        if (code === 0) {
            resolve(code);
        } else {
            const detail = silent && captured.err.trim() ? `\n${captured.err.trim()}` : '';
            reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}${detail}`));
        }
    });
    child.on('error', function (err) {
        reject(err);
    });
});

function produceNgOptions(ngOptionsString) {
    if (!ngOptionsString?.trim()) {
        return [];
    }
    const tokens = ngOptionsString.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    return tokens.map(token => token.replace(/^(["'])|(["'])$/g, ''));
}

// const getAngularVersion = async () => {
//     return await cli.default({ cliArgs: ['--version'] });
// }

const createNewProject = async (name, uiKitType, isOpenApi, ngOptionsString, angularVersion, complete) => {
    const ngOptions = produceNgOptions(ngOptionsString);

    if (isOpenApi) {
        console.info(`Creating project ${name}`);
        // await cli.default({ cliArgs: ['new', name, '--create-application=false', '--new-project-root=apis', '--skip-install', ...produceNgOptions(ngOptionsString)] });
        await pexec('npx', [`@angular/cli@${angularVersion}`, 'new', name, '--create-application=false', '--new-project-root=apis', ...ngOptions]);
        console.info(`${colors.green('Project created')}`);

        process.chdir(`./${name}`);

        console.info(`Adding ng-keyes`);
        const ngAfelioSrc = config.production ? `${config.packageName}@${version}` : __dirname;
        // await cli.default({ cliArgs: ['add', ngAfelioSrc, '--skip-confirmation', '--ui-kit=none'] });
        await pexec('npx', ['ng', 'add', ngAfelioSrc, '--skip-confirmation', '--ui-kit=none']);
        console.info(`${colors.green('ng-keyes installed')}`);

        console.info(`Creating library project`);
        // await cli.default({ cliArgs: ['generate', 'library', 'api', '--prefix=lib'] });
        await pexec('npx', ['ng', 'generate', 'library', 'api', '--prefix=lib']);
        console.info(`${colors.green('Library created')}`);

        console.info(`Install dependencies`);
        await pexec('npm', ['install', 'ng-openapi-gen@latest', 'gulp@4.0.2', 'gulp-replace@1.0.0', 'gulp-rename@2.0.0', 'minimist@1.2.8', '--save-dev']);
        console.info(`${colors.green('Dependencies installed')}`);

        console.info(`Apply template`);
        if (fs.rm) {
            fs.rmSync('apis/api/src/lib', { recursive: true, force: true });
            fs.rmSync('apis/api/src/public-api.ts', { force: true });
        } else {
            fs.rmdirSync('apis/api/src/lib', { recursive: true });
            fs.unlinkSync('apis/api/src/public-api.ts');
        }

        const subPackageJson = 'apis/api/package.json.tmpl';
        fs.renameSync('apis/api/package.json', subPackageJson);
        const packageJsonFileContent = JSON.parse(fs.readFileSync(subPackageJson, { encoding: 'utf8' }));
        packageJsonFileContent.name = `\${scopeName}\${apiName}`;
        packageJsonFileContent.version = '${apiVersion}';
        packageJsonFileContent.publishConfig = { 'registry': '${apiVersion}' };
        fs.writeFileSync(subPackageJson, JSON.stringify(packageJsonFileContent, null, 2), { encoding: 'utf8' });

        const packageJsonPath = './package.json';
        const packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
        packageJsonContent.scripts = {
            'ng': 'ng',
            'build': 'ng build',
            'ng-afelio': 'ng-afelio',
            'ng-keyes': 'ng-keyes',
            'ng-swagger-gen': 'ng-openapi-gen',
            'regenerate-api': 'ng-keyes api -r ng-swagger-gen-api.json',
            'install-deps': 'export NG_CLI_ANALYTICS=ci && npm ci && ng analytics off',
            'prepare-workspace': 'gulp',
            'package': 'npm run regenerate-api && npm run build',
            'publish': 'npm publish dist/api'
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), { encoding: 'utf8' });

        const templatePath = join(__dirname, 'templates/generate-swagger');
        await fse.copy(templatePath, currentPath);
        console.info(`${colors.green('Template applied')}`);

    } else {
        // await cli.default({ cliArgs: ['new', name, '--routing', '--style=scss', '--skip-install', ...produceNgOptions(ngOptionsString)] });
        await pexec('npx', [`@angular/cli@${angularVersion}`, 'new', name, '--routing', '--style=tailwind', ...ngOptions]);
        process.chdir(`./${name}`);
        const ngAfelioSrc = config.production ? `${config.packageName}@${version}` : __dirname;
        await pexec('npx', ['ng', 'generate', '@schematics/angular:environments']);
        await pexec('npx', ['ng', 'add', ngAfelioSrc, '--skip-confirmation', `--ui-kit=${uiKitType}`, `--complete=${complete}`]);
        // await cli.default({ cliArgs: ['add', ngAfelioSrc, '--skip-confirmation', `--ui-kit=${uiKitType}`] });
    }


    // process.chdir(`./${name}`);
    // if (uiKitType !== uiKitTypes.NONE) {
    //     const { fillUiKit, runUiKit } = require('./scripts/generate-ui-kit');
    //     await cli.default({cliArgs: ['generate', 'application', 'ui-kit', '--routing', '--style=scss', '--skip-tests']});
    //     await fillUiKit(uiKitType);
    //     await runUiKit();
    // }
    // return await addLocalCli(uiKitType !== uiKitTypes.NONE);
    // await cli.default({cliArgs: ['new', name, '--routing', '--style=scss', `--collection=${__dirname}`, ...produceNgOptions(ngOptionsString)]});
};

const serveUIKit = async (port, ngOptionsString) => {
    // return await cli.default({cliArgs: [
    //     'serve',
    //     'ui-kit',
    //     `--port=${port||'5200'}`,
    //     '--host=0.0.0.0',
    //     ...produceNgOptions(ngOptionsString)
    // ]});
    try {
        return await pexec('npx', ['ng', 'serve', 'ui-kit', `--port=${port || '5200'}`, '--host=0.0.0.0', ...produceNgOptions(ngOptionsString)], { cwd: currentPath });
    } catch (error) {
        console.log(colors.yellow('Do you have a ui-kit project ?'));
        throw error;
    }
};

const serveMain = async (environment, port, ngOptionsString, projectName) => {
    // return await cli.default({cliArgs: [
    //     'serve',
    //     `--port=${port||'4200'}`,
    //     '--host=0.0.0.0',
    //     ...( environment ? [`--configuration=${environment}`] : []),
    //     ...produceNgOptions(ngOptionsString)
    // ]});
    if (!projectName) {
        projectName = getConfig('defaultProject');
    }

    const args = ['ng', 'serve'];
    if (projectName) {
        args.push(projectName);
    }
    args.push(`--port=${port || '4200'}`, '--host=0.0.0.0');
    if (environment) {
        args.push(`--configuration=${environment}`);
    }
    args.push(...produceNgOptions(ngOptionsString));

    return await pexec('npx', args, { cwd: currentPath });
};

const generate = async (type, name, ngOptions) => {
    type = `${config.packageName}:${type}`;
    // return await cli.default({ cliArgs: ['generate', type, ...(name ? [name] : []), ...ngOptions] });
    const args = ['ng', 'generate', type];
    if (name) {
        args.push(name);
    }
    args.push(...ngOptions);
    return await pexec('npx', args);
};

const generateApi = (source, moduleName, apiKey, extract, version, proxy) => {
    const { generateSwagger } = require('./scripts/generate-swagger');
    return generateSwagger(source, moduleName, apiKey, extract, version, proxy);
};

const regenerateApi = (source) => {
    const { regenerateSwagger } = require('./scripts/generate-swagger');
    return regenerateSwagger(source);
};

const build = async (environment, ssr, baseHref, ngOptionsString) => {
    // const baseArgs = [
    //     'build',
    //     '--prod',
    //     `--configuration=${environment}`,
    //     ...( baseHref ? [`--base-href=${baseHref}`] : []),
    //     ...produceNgOptions(ngOptionsString)
    // ];
    if (ssr) {
        console.warn(colors.underline(colors.yellow('Not implemented yet.')));
    } else {
        const args = ['ng', 'build', `--configuration=${environment}`];
        if (baseHref) {
            args.push(`--base-href=${baseHref}`);
        }
        args.push(...produceNgOptions(ngOptionsString));
        return await pexec('npx', args, { cwd: currentPath });
        // return await cli.default({cliArgs: baseArgs});
    }
};

const buildStyle = async (watchPath) => {
    try {
        const { buildStyleFromUIKit } = require('./scripts/build-style');
        if (watchPath) {
            await new Promise(function () {
                let first = true;
                let locked = false;
                watchTree(
                    join(currentPath, watchPath),
                    {
                        ignoreDotFiles: true,
                        ignoreNotPermitted: true,
                        ignoreUnreadableDir: true,
                        filter(path) {
                            const fileName = basename(path);
                            return !fileName.includes('.') || fileName.endsWith('.scss');
                        },
                        ignoreDirectoryPattern: /node_modules/
                    },
                    async function () {
                        if (!locked) {
                            locked = true;
                            try {
                                await buildStyleFromUIKit(first);
                                first = false;
                            } catch (e) {
                                console.error(e);
                            }
                            locked = false;
                        }
                    }
                );
            });
        } else {
            await buildStyleFromUIKit();
        }
    } catch (e) {
        console.error(e);
        console.warn(colors.red('You must be in base folder of the application and have a "ui-kit" project to use this command.'));
    }
};

// const generateMocks = async () => {
//     if (currentPath.endsWith('/src')) {
//         return await generateMocksTask();
//     } else {
//         console.warn(colors.red('You must be in src folder to generate mocks.'));
//     }
// }

const checkFiles = async (type, mainFile) => {
    try {
        if (type === 'environment') {
            const checkEnvFiles = require('./scripts/check-files/check-env-files');
            return await checkEnvFiles(mainFile);
        } else {
            const checkI18nFiles = require('./scripts/check-files/check-i18n-files').checkFiles;
            return await checkI18nFiles(mainFile);
        }
    } catch (e) {
        throw e;
    }
};

const generateI18n = async (mainFile) => {
    const { fixI18n } = require('./scripts/check-files/check-i18n-files');
    return fixI18n(mainFile);
};

// ---------------------------------------------------------------------------
// AI devcontainer commands (ng-keyes ai start / shell / stop)
// ---------------------------------------------------------------------------

const isCommandAvailable = (command) => {
    const check = process.platform === 'win32' ? 'where' : 'which';
    try {
        require('child_process').execSync(`${check} ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};

const checkDocker = async () => {
    if (!isCommandAvailable('docker')) {
        throw new Error('Docker is not installed or not in PATH. Please install Docker: https://docs.docker.com/get-docker/');
    }
    // Silent probe: we only care whether the daemon answers, not its version.
    await pexec('docker', ['info'], { silent: true });
};

// @devcontainers/cli is a dependency: run its CLI entry point with node,
// no global install required.
const devcontainerCliPath = join(__dirname, 'node_modules', '@devcontainers', 'cli', 'devcontainer.js');
const gateClient = require('./scripts/ai-gate-client');

// Digest of the generated devcontainer.json network config (proxy alias,
// CA mount, container env) — compared against the running container to
// decide whether it must be recreated.
const devcontainerConfigDigest = () => {
    const target = join(currentPath, '.devcontainer', 'devcontainer.json');
    if (!fse.existsSync(target)) return null;
    return fse.readJsonSync(target)['keyesAI.configDigest'] || null;
};

const containerDigestFromRunning = () => {
    const { execSync } = require('child_process');
    const ids = execSync(
        'docker ps --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    if (!ids.length) return null;
    const out = execSync(
        `docker inspect ${ids[0]} --format "{{range .Config.Env}}{{println .}}{{end}}"`,
        { encoding: 'utf8' }
    );
    const line = out.split('\n').find((l) => l.startsWith('KEYES_AI_CONFIG_DIGEST='));
    return line ? line.split('=')[1] : null;
};

const isContainerConfigStale = (expectedDigest) => {
    if (!expectedDigest) return false;
    const actual = containerDigestFromRunning();
    if (actual === null) return true; // running container predates the digest feature
    return actual !== expectedDigest;
};

const stopAiContainer = async () => {
    const { execSync } = require('child_process');
    const ids = execSync(
        'docker ps -a --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    for (const id of ids) {
        await pexec('docker', ['stop', id]);
    }
};

// Install the mounted corporate CA bundle into the container's system trust
// store, as root (the container's dev user is usually unprivileged). Runs on
// every start — it is idempotent and cheap. Debian/Ubuntu (node image) uses
// update-ca-certificates; the marked append fallback covers minimal images.
const installCaInContainer = async () => {
    if (!gateClient.resolveCaBundle(currentPath)) return;
    const { execSync } = require('child_process');
    const ids = execSync(
        'docker ps --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    if (!ids.length) return;
    const script = [
        '[ -f /etc/pki/ca-bundle.pem ] || exit 0',
        'if [ -d /usr/local/share/ca-certificates ]',
        'then',
        '  cp /etc/pki/ca-bundle.pem /usr/local/share/ca-certificates/keyes-ca.crt',
        '  if command -v update-ca-certificates >/dev/null 2>&1',
        '  then update-ca-certificates >/dev/null 2>&1 || true',
        '  fi',
        'fi',
        'grep -q "keyes-ca-BEGIN" /etc/ssl/certs/ca-certificates.crt 2>/dev/null ||',
        '{ echo "# keyes-ca-BEGIN" >> /etc/ssl/certs/ca-certificates.crt',
        '  cat /etc/pki/ca-bundle.pem >> /etc/ssl/certs/ca-certificates.crt',
        '  echo "# keyes-ca-END" >> /etc/ssl/certs/ca-certificates.crt',
        '}',
        'echo "keyes: corporate CA installed in system trust store"',
    ].join('\n');
    const { spawnSync } = require('child_process');
    const r = spawnSync('docker', ['exec', '-u', 'root', ids[0], 'sh', '-c', script], { encoding: 'utf8' });
    if (r.status === 0) {
        console.log(colors.gray('  ' + (r.stdout || '').trim().split('\n').pop()));
    } else {
        console.log(colors.yellow('  Corporate CA could not be installed in the system trust store:\n' + (r.stderr || '').trim()));
    }
};

const runDevcontainer = (args) => pexec('node', [devcontainerCliPath, ...args]);

const checkApiKey = () => {
    if (!process.env.KEYES_API_KEY) {
        throw new Error(
            `KEYES_API_KEY is missing in your environment.\n` +
            `Export it before starting: export KEYES_API_KEY=xxx`
        );
    }
};

const checkImage = () => {
    if (!process.env.KEYES_AI_IMAGE) {
        throw new Error(
            `KEYES_AI_IMAGE is missing in your environment.\n` +
            `Export it before starting: export KEYES_AI_IMAGE=<imageName>:<tag>`
        );
    }
};

const ensureDevcontainer = () => {
    const target = join(currentPath, '.devcontainer', 'devcontainer.json');
    const proxyUrl = `http://${gateClient.gateAlias(currentPath)}:${gateClient.GATE_PROXY_PORT}`;
    const caBundle = gateClient.resolveCaBundle(currentPath);
    const hosts = gateClient.resolveHosts(currentPath);
    const hostNames = Object.keys(hosts);
    // The *_proxy keys we manage (everything else in containerEnv — including
    // KEYES_API_KEY and the user's own vars — is left untouched).
    const PROXY_KEYS = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY'];
    // Overwrite only OUR sections (proxy env, CA mount, --add-host, digest);
    // every other line the user added survives a refresh.
    const applyNetworkConfig = (config, isNew) => {
        const env = config.containerEnv || (config.containerEnv = {});
        for (const key of PROXY_KEYS) env[key] = proxyUrl;
        // Repair damage from an early buggy refresh that overwrote
        // KEYES_API_KEY with the proxy URL.
        if (env.KEYES_API_KEY && String(env.KEYES_API_KEY).includes('keyes-ai-gate')) {
            env.KEYES_API_KEY = '${env:KEYES_API_KEY}';
        }
        // Corporate CA: mounted read-only, installed in the system trust store
        // right after "devcontainer up" by installCaInContainer() (as root).
        if (!config.mounts) config.mounts = [];
        config.mounts = config.mounts.map(String).filter((m) => !m.includes('ca-bundle.pem'));
        if (caBundle) {
            const caReal = fse.realpathSync(caBundle);
            config.mounts.push(`type=bind,source=${caReal},target=/etc/pki/ca-bundle.pem,readonly=true`);
            console.log(colors.gray(`  Container will trust the corporate CA bundle: ${caReal}`));
        }
        // runArgs: rebuild our own pairs (--network, --add-host), keep the rest.
        const ra = (config.runArgs || []).map(String);
        const kept = [];
        for (let i = 0; i < ra.length; i++) {
            if (ra[i] === '--network' || ra[i] === '--add-host') { i++; continue; }
            kept.push(ra[i]);
        }
        kept.push('--network', 'keyes-ai-net');
        for (const n of hostNames) kept.push('--add-host', `${n}:${hosts[n]}`);
        config.runArgs = kept;
        if (hostNames.length) {
            console.log(colors.gray(`  Static name resolution: ${hostNames.map((n) => `${n}=${hosts[n]}`).join(', ')}`));
        }
        // Fingerprint of the network-relevant config — the running container
        // is compared against it to decide if it must be recreated.
        const digest = require('crypto').createHash('md5')
            .update(JSON.stringify({ runArgs: config.runArgs, mounts: config.mounts, env }))
            .digest('hex').slice(0, 12);
        config['keyesAI.configDigest'] = digest;
        env.KEYES_AI_CONFIG_DIGEST = digest;
        if (isNew) {
            config['keyesAI.generatedBy'] = 'keyes-ai';
        }
    };

    if (fse.existsSync(target)) {
        const existing = fse.readJsonSync(target);
        if (existing['keyesAI.generatedBy'] !== 'keyes-ai') {
            console.log(colors.cyan('.devcontainer/devcontainer.json is not keyes-managed, leaving it untouched.'));
            return;
        }
        const env = existing.containerEnv || {};
        const mounts = (existing.mounts || []).map(String);
        const ra = (existing.runArgs || []).map(String);
        const hasStaleHosts = hostNames.some((n) => !ra.includes(`${n}:${hosts[n]}`));
        const stale = !env.http_proxy || env.http_proxy !== proxyUrl
            || Boolean(caBundle) !== mounts.some((m) => m.includes('ca-bundle.pem'))
            || hasStaleHosts;
        applyNetworkConfig(existing, false);
        fse.writeJsonSync(target, existing, { spaces: 2 });
        console.log(stale
            ? colors.cyan('.devcontainer/devcontainer.json refreshed (network sections only, your other lines kept).')
            : colors.gray('.devcontainer/devcontainer.json already up to date.'));
        return;
    }

    // No file yet: build from the template.
    checkImage();
    const template = join(__dirname, 'templates', 'devcontainer', 'devcontainer.json');
    // Strip full-line // comments only (a naive /\/\// would eat the "//" inside proxy URLs).
    const devcontainerConfig = JSON.parse(fse.readFileSync(template, 'utf8').replace(/^\s*\/\/.*$/gm, ''));
    devcontainerConfig.image = process.env.KEYES_AI_IMAGE;
    applyNetworkConfig(devcontainerConfig, true);
    fse.ensureDirSync(join(currentPath, '.devcontainer'));
    fse.writeJsonSync(target, devcontainerConfig, { spaces: 2 });
    console.log(colors.green(`.devcontainer/devcontainer.json created (image: ${devcontainerConfig.image}).`));
};

// The gate is the only network path out of the devcontainer. It must be up
// before the container, and it stays up as long as the container is usable.
const ensureGate = async () => {
    const existing = await gateClient.getGateStatus(currentPath);
    const caNow = gateClient.resolveCaBundle(currentPath);
    const expectedCa = caNow ? '/run/keyes/ca-bundle.pem' : null;
    const expectedHosts = gateClient.resolveHosts(currentPath);
    const hostsMatch = JSON.stringify(existing && existing.hosts || {}) === JSON.stringify(expectedHosts);
    if (existing && existing.ok && existing.ca === expectedCa && hostsMatch) {
        console.log(colors.gray('  Network gate already running.'));
        return existing;
    }
    if (existing && existing.ok) {
        console.log(colors.gray(`  Gate configuration changed (CA: ${existing.ca !== expectedCa}, hosts: ${!hostsMatch}) — restarting the network gate...`));
        gateClient.stopGate(currentPath);
    }
    gateClient.ensureNetwork();
    gateClient.ensureWhitelist(currentPath);
    gateClient.ensureBlacklist(currentPath);
    const proxyScript = join(__dirname, 'scripts', 'ai-network-proxy.js');
    gateClient.startGate(currentPath, proxyScript);
    return gateClient.waitGateHealthy(currentPath);
};

const aiStart = async () => {    console.log(colors.blue('Checking prerequisites...'));
    await checkDocker();
    checkApiKey();
    ensureDevcontainer();

    console.log(colors.blue('Preparing the network gate (whitelist proxy)...'));
    await ensureGate();
    console.log(colors.gray(
        `  Whitelist: ${gateClient.gateWhitelistPath(currentPath)}\n` +
        `  Events:    ${gateClient.gateEventsPath(currentPath)}\n` +
        `  Pre-allow a host any time with: ng-keyes ai network allow <host>`));

    const hasCode = isCommandAvailable('code');
    if (!hasCode) {
        console.log(colors.yellow('VS Code (code) not found. Starting the container in the background...'));
    } else {
        console.log(colors.blue('Starting the devcontainer...'));
    }

    // devcontainer up is idempotent: it reuses an existing container. A config
    // change (proxy alias, CA bundle) must recreate it: the digest is baked
    // into the container env (KEYES_AI_CONFIG_DIGEST) and compared at start.
    const expectedDigest = devcontainerConfigDigest();
    if (isContainerConfigStale(expectedDigest)) {
        console.log(colors.yellow('  Network config changed — recreating the container...'));
        await stopAiContainer();
    }
    await runDevcontainer(['up', '--workspace-folder', currentPath]);
    // The user is unprivileged inside the container, so the CA is installed
    // from the host as root (idempotent, runs on every start).
    await installCaInContainer();

    if (hasCode) {
        console.log(colors.green(
            `Devcontainer is up. Reopen this folder in VS Code to enter the container\n` +
            `(or use "Dev Containers: Reopen in Container" from the command palette).\n` +
            `Network egress goes through the gate: whitelisted hosts pass silently,\n` +
            `anything else prompts — run "ng-keyes ai network watch" to answer the\n` +
            `prompts (or pre-allow hosts with "ng-keyes ai network allow <host>").`));
    } else {
        console.log(colors.green(
            `Container started in the background.\n` +
            `Enter the container with:   ng-keyes ai shell\n` +
            `Answer network prompts with:  ng-keyes ai network watch\n` +
            `Stop it with:               ng-keyes ai stop`));
    }
};

const isContainerRunning = () => {
    const { execSync } = require('child_process');
    const ids = execSync(
        'docker ps --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    return ids.length > 0;
};

const aiExec = async (cmdArgs) => {
    await checkDocker();
    if (!isContainerRunning()) {
        throw new Error(
            `No devcontainer is currently running for ${currentPath}.\n` +
            `Start it first with: ng-keyes ai start`);
    }
    await ensureGate();
    console.log(colors.blue(`Running in devcontainer: ${cmdArgs.join(' ')}\n`));
    // No decision loop here: the container's command owns stdin. Decisions
    // are answered from a separate terminal (ai network watch); unanswered
    // requests are denied after 30s.
    await runDevcontainer(['exec', '--workspace-folder', currentPath, '--', ...cmdArgs]);
};

const aiShell = async () => {
    await checkDocker();
    if (!isContainerRunning()) {
        throw new Error(
            `No devcontainer is currently running for ${currentPath}.\n` +
            `Start it first with: ng-keyes ai start`);
    }
    await ensureGate();
    console.log(colors.blue('Entering the devcontainer shell...'));
    console.log(colors.gray('Non-whitelisted network requests will be denied until answered: run "ng-keyes ai network watch" in another terminal.\n'));
    // No decision loop here: the container's shell owns stdin (a second
    // reader would swallow characters). Decisions are answered from a
    // separate terminal; unanswered requests are denied after 30s.
    await runDevcontainer(['exec', '--workspace-folder', currentPath, '--', 'bash']);
};

const aiStatus = async () => {
    await checkDocker();
    const { execSync } = require('child_process');
    const rows = execSync(
        'docker ps -a --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}\t{{.State}}\t{{.Status}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    if (!rows.length) {
        console.log(`\n${colors.yellow('✖')} No devcontainer for this folder (${colors.cyan(currentPath)}).`);
        console.log(colors.gray(`  Start it with: ng-keyes ai start\n`));
        return;
    }

    const gate = await gateClient.getGateStatus(currentPath);
    if (gate) {
        console.log(`${colors.green('✔')} Network gate ${colors.green('running')} (control on 127.0.0.1:${gateClient.gateHostPort(currentPath)})`);
        console.log(colors.gray(`  Whitelisted: ${gate.whitelist.join(', ') || '(none)'}${gate.session.length ? `\n  Session-allowed: ${gate.session.join(', ')}` : ''}${gate.pending ? `\n  Pending decisions: ${gate.pending}` : ''}\n  Whitelist file: ${gateClient.gateWhitelistPath(currentPath)}`));
    } else {
        console.log(`${colors.red('✖')} Network gate ${colors.red('down')} — the container has no network access at all`)
        console.log(colors.gray(`  Restart it with: ng-keyes ai start\n`));
    }

    for (const row of rows) {
        const [id, state, status] = row.split('\t');
        if (state === 'running') {
            console.log(`\n${colors.green('✔')} Devcontainer ${colors.green('running')}`);
        } else {
            console.log(`\n${colors.red('✖')} Devcontainer ${colors.red(state)} (${status})`);
        }
        console.log(colors.gray(`  Folder: ${currentPath}\n  ID:     ${id}`));
        console.log(state === 'running'
            ? colors.gray(`  Enter it with:   ng-keyes ai shell\n  Stop it with:    ng-keyes ai stop\n`)
            : colors.gray(`  Start it with:   ng-keyes ai start\n  Remove it with:  ng-keyes ai rm\n`));
    }
};

const aiStop = async () => {
    await checkDocker();
    const { execSync } = require('child_process');
    // The devcontainer CLI has no "stop" command (stopping is the job of the
    // VS Code extension). But it labels the containers it creates with
    // "devcontainer.local_folder" = workspace folder path, so we target the
    // container through that label and stop it with docker.
    const ids = execSync(
        'docker ps -a --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    if (!ids.length) {
        throw new Error(
            `No devcontainer found for ${currentPath}.\n` +
            `If you just started it, run: ng-keyes ai start`);
    }

    for (const id of ids) {
        console.log(colors.blue(`Stopping container ${id}...`));
        await pexec('docker', ['stop', id]);
    }
    gateClient.stopGate(currentPath);
    console.log(colors.green('Devcontainer stopped.'));
};

const aiRm = async (force) => {
    await checkDocker();
    const { execSync } = require('child_process');
    const ids = execSync(
        'docker ps -a --filter label=devcontainer.local_folder="' + currentPath + '" --format "{{.ID}}"',
        { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    if (!ids.length) {
        throw new Error(`No devcontainer found for ${currentPath}. Nothing to remove.`);
    }

    for (const id of ids) {
        if (!force) {
            const state = execSync(`docker inspect ${id} --format '{{.State.Status}}'`, { encoding: 'utf8' }).trim();
            if (state === 'running') {
                throw new Error(
                    `Container ${id} is still running.\n` +
                    `Stop it first with: ng-keyes ai stop\n` +
                    `Or force the removal with: ng-keyes ai rm --force`);
            }
        }
        console.log(colors.blue(`Removing container ${id}...`));
        await pexec('docker', ['rm', ...(force ? ['-f'] : []), id]);
    }
    gateClient.stopGate(currentPath);
    console.log(colors.green('Devcontainer removed.'));
};
const aiNetworkAllow = async (hosts) => {    if (!hosts.length) {
        throw new Error('Usage: ng-keyes ai network allow <host...>  (e.g. ng-keyes ai network allow registry.npmjs.org *.github.com)');
    }
    gateClient.ensureWhitelist(currentPath);
    gateClient.ensureBlacklist(currentPath);
    const live = await gateClient.getGateStatus(currentPath);
    if (live && live.ok) {
        const result = await gateClient.postWhitelist(currentPath, hosts);
        if (result) {
            console.log(colors.green(`Whitelist updated (live): ${result.all.join(', ')}`));
            return;
        }
        console.log(colors.yellow('Gate is running but the live update failed; updating the file only.'));
    }
    // Update the file directly (the gate picks it up on restart).
    const wlPath = gateClient.gateWhitelistPath(currentPath);
    const current = fse.existsSync(wlPath) ? fse.readJsonSync(wlPath) : [];
    const merged = [...current, ...hosts.filter((h) => !current.includes(h))];
    fse.writeJsonSync(wlPath, merged, { spaces: 2 });
    // A permanent deny loses to an explicit allow.
    const blPath = gateClient.gateBlacklistPath(currentPath);
    if (fse.existsSync(blPath)) {
        const bl = fse.readJsonSync(blPath).filter((h) => !hosts.includes(h));
        fse.writeJsonSync(blPath, bl, { spaces: 2 });
    }
    console.log(colors.green(`Whitelist file updated: ${wlPath}\n${merged.join('\n')}`));
    if (!live) {
        console.log(colors.gray('  (gate not running — takes effect on next "ng-keyes ai start")'));
    }
};

const aiNetworkDeny = async (hosts, { remove = false } = {}) => {
    if (!hosts.length) {
        throw new Error(`Usage: ng-keyes ai network deny <host...>  (e.g. ng-keyes ai network deny evil.example.com)
${remove ? '' : 'Use: ng-keyes ai network deny --remove <host...>  to lift a permanent deny'}`);
    }
    gateClient.ensureWhitelist(currentPath);
    gateClient.ensureBlacklist(currentPath);
    const blPath = gateClient.gateBlacklistPath(currentPath);
    const wlPath = gateClient.gateWhitelistPath(currentPath);
    const current = fse.existsSync(blPath) ? fse.readJsonSync(blPath) : [];
    const blacklist = remove
        ? current.filter((h) => !hosts.includes(h))
        : [...current, ...hosts.filter((h) => !current.includes(h))];
    fse.writeJsonSync(blPath, blacklist, { spaces: 2 });
    if (!remove) {
        const wl = fse.existsSync(wlPath) ? fse.readJsonSync(wlPath) : [];
        const cleaned = wl.filter((h) => !hosts.includes(h));
        if (cleaned.length !== wl.length) fse.writeJsonSync(wlPath, cleaned, { spaces: 2 });
    }
    const live = await gateClient.getGateStatus(currentPath);
    if (live && live.ok) {
        const result = await gateClient.postBlacklist(currentPath, hosts, remove);
        if (result) {
            console.log(colors.green(`Blacklist updated (live): ${result.all.join(', ') || '(empty)'}`));
            return;
        }
    }
    console.log(colors.green(`Permanent ${remove ? 'deny removed' : 'denied'}: ${hosts.join(', ')}\n${blacklist.join('\n')}`));
    if (!live || !live.ok) {
        console.log(colors.gray('  (gate not running — takes effect on next "ng-keyes ai start")'));
    }
};

const aiNetworkHosts = async (pairs) => {
    if (!pairs.length) {
        throw new Error('Usage: ng-keyes ai network hosts <name=ip> [...]  (e.g. ng-keyes ai network hosts intranet.keyes.local=10.20.0.5)');
    }
    const parsed = {};
    for (const pair of pairs) {
        const eq = pair.indexOf('=');
        const name = eq === -1 ? pair : pair.slice(0, eq);
        const ip = eq === -1 ? null : pair.slice(eq + 1).trim();
        if (!name || !ip) {
            throw new Error(`Invalid host entry "${pair}" — expected name=ip (e.g. intranet.keyes.local=10.20.0.5).`);
        }
        parsed[name] = ip;
    }
    const path = gateClient.gateHostsPath(currentPath);
    const current = gateClient.resolveHosts(currentPath);
    const merged = { ...current, ...parsed };
    fse.ensureDirSync(dirname(path));
    fse.writeJsonSync(path, merged, { spaces: 2 });
    console.log(colors.green(`Static name resolution updated: ${path}\n` + Object.entries(merged).map(([n, i]) => `  ${n} -> ${i}`).join('\n')));
    console.log(colors.gray('  Takes effect on next "ng-keyes ai start" (gate + container must see the mapping).'));
    return {
        message: `Hosts file updated: ${path}`,
        data: merged
    };
};

const aiNetworkCaBundle = async (url) => {
    if (!url || !/^https:\/\//.test(url)) {
        throw new Error('Usage: ng-keyes ai network ca <https-url>  (e.g. ng-keyes ai network ca https://ghe.keyes.eu)');
    }
    const { parse: parseUrl } = require('url');
    const { hostname, port } = parseUrl(url);
    const portNum = parseInt(port, 10) || 443;
    // Node's TLS API only exposes the leaf certificate, so use openssl to
    // capture the full chain (leaf + intermediates + root when sent).
    const { execFileSync } = require('child_process');
    let out;
    try {
        out = execFileSync('openssl', [
            's_client', '-showcerts', '-servername', hostname, '-connect', `${hostname}:${portNum}`
        ], { input: 'Q', encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
        const detail = (err.stdout || err.stderr || err.message || '').toString().split('\n').slice(0, 5).join('\n');
        throw new Error(`Could not fetch the certificate chain of ${hostname}:${portNum} via openssl:\n${detail}`);
    }
    const blocks = out.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
    if (!blocks.length) {
        throw new Error(`No certificate returned by ${hostname}:${portNum} (is openssl available and reachable?)`);
    }
    const target = join(currentPath, '.devcontainer', 'network', 'ca-bundle.pem');
    fse.ensureDirSync(dirname(target));
    fse.writeFileSync(target, blocks.map((b) => b.trim()).join('\n') + '\n');
    console.log(colors.green(`CA bundle written to ${target} (${blocks.length} certificates from ${hostname}).`));
    console.log(colors.gray('  Re-run "ng-keyes ai start" to apply it to the container (it will be recreated).'));
};

const aiNetworkWatch = async () => {
    const live = await gateClient.getGateStatus(currentPath);
    if (!live || !live.ok) {
        throw new Error(
            `No network gate is running for ${currentPath}.\n` +
            `Start it with: ng-keyes ai start`);
    }
    console.log(colors.blue(`Watching for network requests (whitelist: ${gateClient.gateWhitelistPath(currentPath)})...`));
    console.log(colors.gray('Ctrl+C to stop watching (the gate keeps running and denies unanswered requests after 30s).\n'));
    const rl = gateClient.decisionLoop(currentPath);
    await new Promise((resolve) => {
        process.on('SIGINT', () => {
            console.log(colors.blue('\nStopped watching. The gate keeps denying unanswered requests.'));
            rl.close();
            resolve();
        });
    });
};

module.exports = {
    // getAngularVersion,
    createNewProject,
    serveUIKit,
    serveMain,
    generate,
    build,
    buildStyle,
    // generateMocks,
    generateApi,
    regenerateApi,
    checkFiles,
    generateI18n,
    aiStart,
    aiShell,
    aiStop,
    aiRm,
    aiStatus,
    aiExec,
    aiNetworkAllow,
    aiNetworkDeny,
    aiNetworkHosts,
    aiNetworkCaBundle,
    aiNetworkWatch
};
