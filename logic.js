// const util = require('util');
const exec = require('child_process').exec;
const colors = require('colors');
// const fs = require('fs');

const cli = require('@angular/cli');

// const addLocalCli = require('./scripts/add-local-cli');

// const uiKitTypes = require('./models/ui-kit-types.enum');
const config = require('./config');
const { version } = require('./package.json');

const currentPath = process.cwd();

function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

pexec = (command, options) => promiseFromChildProcess(exec(command, options));


const getAngularVersion = async () => {
    return await cli.default({cliArgs: ['--version']});
}

const createNewProject = async (name, uiKitType, ngOptionsString) => {
    await cli.default({cliArgs: ['new', name, '--routing', '--style=scss', '--skip-install', ...produceNgOptions(ngOptionsString)]});
    process.chdir(`./${name}`);
    const ngAfelioSrc = config.production ? `ng-afelio@${version}` : __dirname;
    await cli.default({cliArgs: ['add', ngAfelioSrc, `--ui-kit=${uiKitType}`]});
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
    return await pexec(`npx ng serve ui-kit --port=${port||'5200'} --host=0.0.0.0 ${produceNgOptions(ngOptionsString).join(' ')}`, { cwd: currentPath });
}

const serveMain = async (environment, port, ngOptionsString) => {
    // return await cli.default({cliArgs: [
    //     'serve',
    //     `--port=${port||'4200'}`,
    //     '--host=0.0.0.0',
    //     ...( environment ? [`--configuration=${environment}`] : []),
    //     ...produceNgOptions(ngOptionsString)
    // ]});
    return await pexec(`npx ng serve --port=${port||'5200'} --host=0.0.0.0 ${environment ? [`--configuration=${environment}`] : ''} ${produceNgOptions(ngOptionsString).join(' ')}`, { cwd: currentPath });
}

const generate = async (type, name, ngOptions) => {
    type = `ng-afelio:${type}`
    return await cli.default({cliArgs: ['generate', type, ...(name ? [name] : []), ...ngOptions]});
}

const generateApi = (source, moduleName, apiKey, extract, version, proxy) => {
    const { generateSwagger } = require('./scripts/generate-swagger');
    return generateSwagger(source, moduleName, apiKey, extract, version, proxy);
}

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
        return await pexec(`npx ng build --prod --configuration=${environment} ${baseHref ? `--base-href=${baseHref}` : ''} ${produceNgOptions(ngOptionsString).join('')}`, { cwd: currentPath });
        // return await cli.default({cliArgs: baseArgs});
    }
}

const buildStyle = async () => {
    try {
        const buildStyleFromUIKit = require('./scripts/build-style');
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

const checkFiles = async (type, mainFile) => {
    try {
        if (type === 'environment') {
            const checkEnvFiles = require('./scripts/check-files/check-env-files');
            return await checkEnvFiles(mainFile || 'environment.ts');
        } else {
            const checkI18nFiles = require('./scripts/check-files/check-i18n-files');
            return await checkI18nFiles(mainFile || 'fr.json');
        }
    } catch(e) {
    }
}

function produceNgOptions(ngOptionsString) {
    let ngOptions = [];
    if (ngOptionsString) {
        ngOptions = ngOptionsString.split(' ');
    }
    return ngOptions;
}

const generateModelsFromGeneratedApi = async (folderSource, outputFolder, apiName ) => {
    const generateModelsFromApi = require('./scripts/api-models-converter/model-converter');
    return generateModelsFromApi(folderSource, outputFolder, apiName); 
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
    regenerateApi,
    checkFiles,
    generateModelsFromGeneratedApi
};
