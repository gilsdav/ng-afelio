
const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const exec = require('child_process').exec;
const colors = require('colors');
const fs = require('fs');

const cli = require('@angular/cli');

const fillModule = require('./scripts/generate-module');
const fillUiKit = require('./scripts/generate-ui-kit');
const buildStyleFromUIKit = require('./scripts/build-style');
const addLocalCli = require('./scripts/add-local-cli');
const generateMocksTask = require('./scripts/generate-mocks');
const { generateSwagger, regenerateSwagger } = require('./scripts/generate-swagger');

const uiKitTypes = require('./models/ui-kit-types.enum');

const currentPath = process.cwd();

function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

const getAngularVersion = async () => {
    return await cli.default({cliArgs: ['--version']});
}

const createNewProject = async (name, uiKitType) => {
    await cli.default({cliArgs: ['new', name, '--routing', '--style=scss']});
    process.chdir(`./${name}`);
    if (uiKitType !== uiKitTypes.NONE) {
        await cli.default({cliArgs: ['generate', 'application', 'ui-kit', '--routing', '--style=scss', '--skip-tests']});
        await fillUiKit(uiKitType);
    }
    return await addLocalCli(uiKitType !== uiKitTypes.NONE);
};

const serveUIKit = async (port) => {
    return await cli.default({cliArgs: [
        'serve',
        'ui-kit',
        `--port=${port||'5200'}`,
        '--host=0.0.0.0'
    ]});
}

const serveMain = async (environment, port) => {
    return await cli.default({cliArgs: [
        'serve',
        `--port=${port||'4200'}`,
        '--host=0.0.0.0',
        ...( environment ? [`--configuration=${environment}`] : [])
    ]});
}

const generate = async (type, name, needStore, light) => {
    switch (type) {
        case 'module':
            if (currentPath.includes('/src/') || currentPath.endsWith('/src')) {
                await cli.default({cliArgs: ['generate', type, name]});
                return fillModule(name, needStore, light);
            } else {
                console.warn(colors.red('You must be in src folder or its childs to generate a module.'));
            }
            break;
        // case 'swagger':
        //     const source = name;
        //     const moduleName = needStore;
        //     const apiKey = light;
        //     return generateSwagger(source, moduleName, apiKey);
        default:
            return await cli.default({cliArgs: ['generate', type, name]});
    }
}

const generateApi = (source, moduleName, apiKey, extract, version) => {
    return generateSwagger(source, moduleName, apiKey, extract, version);
}

const regenerateApi = (source) => {
    return regenerateSwagger(source);
};

const build = async (environment, ssr, baseHref) => {
    const baseArgs = ['build', '--prod', `--configuration=${environment}`, ...( baseHref ? [`--base-href=${baseHref}`] : [])];
    if (ssr) {
        console.warn(colors.underline(colors.yellow('Not implemented yet.')));
    } else {
        return await cli.default({cliArgs: baseArgs});
    }
}

const buildStyle = async () => {

    let contains = false;
    fs.readdirSync('./').forEach(file => {
        if (file === 'projects') {
            contains = true;
        }
    });

    if (contains) {
        contains = false;
        fs.readdirSync('./projects').forEach(file => {
            if (file === 'ui-kit') {
                contains = true;
            }
        });
    }

    if (contains) {
        process.chdir(`./projects/ui-kit`);
        return await buildStyleFromUIKit();
    } else {
        console.warn(colors.red('You must be in base folder of the application and have a "ui-kit" project to use this command.'));
    }
    
}

const generateMocks = async () => {
    if (currentPath.endsWith('/src')) {
        return await generateMocksTask();
    } else {
        console.warn(colors.red('You must be in src folder to generate mocks.'));
    }
}

// Export all methods
module.exports = {
    getAngularVersion,
    createNewProject,
    serveUIKit,
    serveMain,
    generate,
    build,
    buildStyle,
    generateMocks,
    generateApi,
    regenerateApi
};
