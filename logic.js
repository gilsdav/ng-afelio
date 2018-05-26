
const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const exec = require('child_process').exec;
const colors = require('colors');

const cli = require('@angular/cli');

const fillModule = require('./scripts/generate-module');

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

const createNewProject = async (name, skipUiKit) => {
    await cli.default({cliArgs: ['new', name, '--routing', '--style=scss']});
    process.chdir(`./${name}`);
    if (!skipUiKit) {
        return await cli.default({cliArgs: ['generate', 'application', 'ui-kit', '--routing', '--style=scss', '--skip-tests']});
    } else {
        return;
    }
};

const serveUIKit = async () => {
    return await cli.default({cliArgs: ['serve', 'ui-kit', '--port=5200', '--host=0.0.0.0']});
}

const serveMain = async () => {
    return await cli.default({cliArgs: ['serve', '--host=0.0.0.0']});
}

const generate = async (type, name, needStore, light) => {
    switch (type) {
        case 'module':
            if (currentPath.includes('/src/') || currentPath.endsWith('/src')) {
                await cli.default({cliArgs: ['generate', type, name]});
                return fillModule(name, needStore, light);
            } else {
                console.warn(colors.red('You must be in src folder to generate a module'));
            }
            break;
        default:
            return await cli.default({cliArgs: ['generate', type, name]});
            break;
    }
}

const build = async (environment, ssr, baseHref) => {
    const baseArgs = ['build', '--prod', `--configuration=${environment}`, ...( baseHref ? [`--base-href=${baseHref}`] : [])];
    if (ssr) {
        console.warn(colors.underline(colors.yellow('Not implemented yet.')));
    } else {
        return await cli.default({cliArgs: baseArgs});
    }
}

// Export all methods
module.exports = {
    getAngularVersion,
    createNewProject,
    serveUIKit,
    serveMain,
    generate,
    build
};
