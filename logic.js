
// const util = require('util');
// const exec = require('child_process').exec;
const colors = require('colors');
// const fs = require('fs');

const cli = require('@angular/cli');

const { fillUiKit, runUiKit } = require('./scripts/generate-ui-kit');
const buildStyleFromUIKit = require('./scripts/build-style');
const addLocalCli = require('./scripts/add-local-cli');
const { generateSwagger, regenerateSwagger } = require('./scripts/generate-swagger');

const uiKitTypes = require('./models/ui-kit-types.enum');

// const currentPath = process.cwd();

// function promiseFromChildProcess(child) {
//     return new Promise(function (resolve, reject) {
//         child.addListener("error", reject);
//         child.addListener("exit", resolve);
//     });
// }

const getAngularVersion = async () => {
    return await cli.default({cliArgs: ['--version']});
}

const createNewProject = async (name, uiKitType, ngOptionsString) => {
    await cli.default({cliArgs: ['new', name, '--routing', '--style=scss', ...produceNgOptions(ngOptionsString)]});
    process.chdir(`./${name}`);
    if (uiKitType !== uiKitTypes.NONE) {
        await cli.default({cliArgs: ['generate', 'application', 'ui-kit', '--routing', '--style=scss', '--skip-tests']});
        await fillUiKit(uiKitType);
        await runUiKit();
    }
    return await addLocalCli(uiKitType !== uiKitTypes.NONE);
};

const serveUIKit = async (port, ngOptionsString) => {
    return await cli.default({cliArgs: [
        'serve',
        'ui-kit',
        `--port=${port||'5200'}`,
        '--host=0.0.0.0',
        ...produceNgOptions(ngOptionsString)
    ]});
}

const serveMain = async (environment, port, ngOptionsString) => {
    return await cli.default({cliArgs: [
        'serve',
        `--port=${port||'4200'}`,
        '--host=0.0.0.0',
        ...( environment ? [`--configuration=${environment}`] : []),
        ...produceNgOptions(ngOptionsString)
    ]});
}

const generate = async (type, name, ngOptions) => {
    type = `ng-afelio:${type}`
    return await cli.default({cliArgs: ['generate', type, ...(name ? [name] : []), ...ngOptions]});
}

const generateApi = (source, moduleName, apiKey, extract, version, proxy) => {
    return generateSwagger(source, moduleName, apiKey, extract, version, proxy);
}

const regenerateApi = (source) => {
    return regenerateSwagger(source);
};

const build = async (environment, ssr, baseHref, ngOptionsString) => {
    const baseArgs = [
        'build',
        '--prod',
        `--configuration=${environment}`,
        ...( baseHref ? [`--base-href=${baseHref}`] : []),
        ...produceNgOptions(ngOptionsString)
    ];
    if (ssr) {
        console.warn(colors.underline(colors.yellow('Not implemented yet.')));
    } else {
        return await cli.default({cliArgs: baseArgs});
    }
}

const buildStyle = async () => {
    try {
        return await buildStyleFromUIKit();
    } catch(e) {
        console.error(e);
        console.warn(colors.red('You must be in base folder of the application and have a "ui-kit" project to use this command.'));
    }
    
}

// const generateMocks = async () => {
//     if (currentPath.endsWith('/src')) {
//         return await generateMocksTask();
//     } else {
//         console.warn(colors.red('You must be in src folder to generate mocks.'));
//     }
// }

function produceNgOptions(ngOptionsString) {
    let ngOptions = [];
    if (ngOptionsString) {
        ngOptions = ngOptionsString.split(' ');
    }
    return ngOptions;
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
    // generateMocks,
    generateApi,
    regenerateApi
};
