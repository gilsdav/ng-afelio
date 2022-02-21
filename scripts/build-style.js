const { Bundler } = require('scss-bundle');
const fs = require('fs');
// const fse = require('fs-extra');
const decomment = require('decomment');
const colors = require('colors');

const sass = require('sass');
// const magicImporter = require('node-sass-magic-importer');

const cssNodeExtract = require('css-node-extract');
const postcssScssSyntax = require('postcss-scss');

const path = require('path');

const baseConfig = require('../templates/config/ng-afelio.json');
const configPath = 'ng-afelio.json';

let outputDirectory = '../../styles';
let inputDirectory = './projects/ui-kit';
let inputPrefix = './src/';
let angularConfigPath = '../../angular.json';

function reorganiseScssUse(scssSrc) {
    let toReplace = [];

    scssSrc = scssSrc.replace(/@use .+;/gi, replacer => {
        if (!toReplace.includes(replacer)) {
            toReplace.push(replacer)
        }
        return '';
    });

    const usesLine = toReplace.join(' ');

    return usesLine + scssSrc;
}

function logSameLine(textToLog, isEnd) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(textToLog);
    if (isEnd) {
        process.stdout.write("\n");
    }
}

function enforceDirectoryExistance(currentPath) {
    const directory = path.dirname(currentPath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}

function readConfig() {
    if (!fs.existsSync(configPath)) {
        writeConfig(baseConfig);
    }
    const fileContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(fileContent);
}

function writeConfig(jsonContent) {
    fs.writeFileSync(configPath, JSON.stringify(jsonContent, null, 2), 'utf8');
}

function initFolder(config) {
    inputDirectory = typeof config.style.baseInputDirectory !== undefined ? config.style.baseInputDirectory : inputDirectory;
    process.chdir(inputDirectory);

    outputDirectory = typeof config.style.baseOutputDirectory !== undefined ? config.style.baseOutputDirectory : outputDirectory;
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }

    inputPrefix = typeof config.style.inputPrefix !== undefined ? config.style.inputPrefix : inputPrefix;

    // Angular config
    const countSlashes = inputDirectory.replace('./', '').split('/').reduce((result) => {
        return result += '../';
    }, '');
    angularConfigPath = `${countSlashes}angular.json`;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function buildUtils(config, bundlerBasePath) {
    const bundler = new Bundler(undefined, bundlerBasePath);

    if (!config.style.styleUtils) {
        return false;
    }

    const isNewArrayVersion = Array.isArray(config.style.styleUtils);

    function bundling(input, output) {
        return bundler.bundle(path.join(inputPrefix, input)).then(result => {
            if (!result.found) {
                console.error(colors.red(`BUILD ERROR file "${input}" not found`));
                return Promise.resolve(false);
            }
            const toWrite = decomment.text(result.bundledContent/*, {safe: true}*/);
            const options = {
                css: toWrite,
                filters: ['silent'],
                postcssSyntax: postcssScssSyntax
            };
            return cssNodeExtract.process(options).then((extractedCss) => {
                const outputPath = path.join(outputDirectory, output);
                enforceDirectoryExistance(outputPath);
                return new Promise((resolve, error) => {
                    fs.writeFile(outputPath, extractedCss, function (err) {
                        if (!err) {
                            console.info(`${colors.green('BUILD style utils')} was saved in "${outputPath}"`);
                            resolve(true);
                        } else {
                            console.error(colors.red(`WRITE FILE ERROR ${output}`), err);
                            error(err);
                        }
                    });
                });
            }, err => {
                console.error(colors.red(`BUILD ERROR ${output}`), err);
            });
        });
    }

    if (isNewArrayVersion) {
        // New Version
        const enabled = config.style.styleUtils.length > 0;
        if (enabled) {
            let allGenerated = true;
            await asyncForEach(config.style.styleUtils, async styleUtilConfig => {
                allGenerated = allGenerated && await bundling(styleUtilConfig.input, styleUtilConfig.output);
            });
            return allGenerated;
        } else {
            return false;
        }

    } else {
        // Old Version
        const enabled = config.style.styleUtils.enable;
        if (enabled) {
            const input = (config && config.style && config.style.styleUtils && config.style.styleUtils.input) || 'styles.scss';
            const output = (config && config.style && config.style.styleUtils && config.style.styleUtils.output) || 'style-utils.scss';
            return await bundling(input, output);
        } else {
            return false;
        }
    }

}

function buildStyleFiles(config, bundlerBasePath) {
    const bundler = new Bundler(undefined, bundlerBasePath);

    const files = (config && config.style && config.style.files) || [{ "input": "styles.scss", "output": "main.scss" }];

    function bundling(input, output, isGlobal) {
        logSameLine(`${colors.blue(`PROCESS bundling...`)} "${input}"`);
        return bundler.bundle(path.join(inputPrefix, input)).then(async result => {
            if (!result.found) {
                console.error(colors.red(`BUILD ERROR file "${input}" not found`));
                return Promise.resolve(false);
            }
            logSameLine(`${colors.blue(`PROCESS uncommenting...`)} "${input}"`);

            let toWrite = decomment.text(result.bundledContent/*, {safe: true}*/);
            logSameLine(`${colors.blue(`PROCESS reorganising...`)} "${input}"`);
            toWrite = reorganiseScssUse(toWrite);
            logSameLine(`${colors.blue(`PROCESS compiling...`)} "${input}"`, true);
            const outputPath = path.join(outputDirectory, output);
            enforceDirectoryExistance(outputPath);

            // const cwd = process.cwd();
            // process.chdir(path.dirname(path.join(process.cwd(), inputPrefix, input)));

            await new Promise((resolve, error) => {
                try {
                    // const compiledFile = sass.compileString(toWrite, { importer: magicImporter() });
                    const compiledFile = sass.compileString(toWrite);
                    fs.writeFile(outputPath, compiledFile.css, (err) => {
                        if (!err) {
                            console.info(`${colors.green(`BUILD ${isGlobal ? 'global ' : ''}style`)} was saved in "${outputPath}"`);
                            resolve();
                        } else {
                            console.error(colors.red(`WRITE FILE ERROR ${outputPath}`), err);
                            error(err);
                        }
                    });
                } catch (err) {
                    console.error(colors.red(`BUILD ERROR ${outputPath}`), err);
                    error(err);
                }
            });

            if (isGlobal) {
                const toAddToStyleScss = `@import '../styles/${output}';`;
                const stylePath = '../../src/styles.scss';
                const fileContent = fs.readFileSync(stylePath, 'utf8');
                if (!fileContent.includes(toAddToStyleScss)) {
                    fs.appendFileSync(stylePath, `${toAddToStyleScss}`);
                    console.info(`${colors.green('ADDED')} "${toAddToStyleScss}" added into "/src/styles.scss"`);
                }
            }
        });
    }

    return asyncForEach(files, async file => {
        const input = file.input;
        const output = file.output || file.input;
        const isGlobal = file.global;
        await bundling(input, output, isGlobal);
    })
}

function checkAssetsConfiguration(config) {
    if (!config || !config.style || config.style.addUiKitAssets !== false) {
        const assetsPath = `${inputDirectory.replace('./', '')}/src/assets`;
        const toAddToAngularConfig = { "input": assetsPath, "glob": "**/*", "output": "./assets" };
        const fileContent = fs.readFileSync(angularConfigPath, 'utf8');
        if (!fileContent.includes(`"input": "${assetsPath}"`)) {
            const jsonContent = JSON.parse(fileContent);
            const defaultProject = jsonContent.defaultProject;
            const builds = Object.keys(jsonContent.projects[defaultProject].architect);
            builds.forEach((build) => {
                const currentBuildConfig = jsonContent.projects[defaultProject].architect[build];
                if (currentBuildConfig.options && currentBuildConfig.options.assets) {
                    currentBuildConfig.options.assets.push(toAddToAngularConfig);
                }
            });
            fs.writeFileSync(angularConfigPath, JSON.stringify(jsonContent, null, 2), 'utf8');
            console.info(`${colors.green('ADD ASSETS')} UI Kit assets added to ${defaultProject} project`);
        }
    }
}

function checkStyleShortcut(config) {
    if (!config || !config.style || config.style.addAngularStyleShortcut !== false) {
        const stylePath = path.join(inputDirectory, outputDirectory);
        const fileContent = fs.readFileSync(angularConfigPath, 'utf8');
        if (!fileContent.includes('"stylePreprocessorOptions"')) {
            const jsonContent = JSON.parse(fileContent);
            const defaultProject = jsonContent.defaultProject;
            const buildOptions = jsonContent.projects[defaultProject].architect.build.options;
            buildOptions.stylePreprocessorOptions = { includePaths: [stylePath] };
            fs.writeFileSync(angularConfigPath, JSON.stringify(jsonContent, null, 2), 'utf8');
            console.info(`${colors.green('ADD CSS SHORTCUT')} "styles" shortcut added to ${defaultProject} project`);
        }
    }
}

let currentConfig;
function buildStyleFromUIKit(needInit = true) {
    if (needInit) {
        currentConfig = readConfig();
        initFolder(currentConfig);
    }

    const currentPath = process.cwd();

    return Promise.all([
        buildUtils(currentConfig, currentPath),
        buildStyleFiles(currentConfig, currentPath)
    ]).then(() => {
        if (needInit) {
            checkAssetsConfiguration(currentConfig);
            checkStyleShortcut(currentConfig);
        }
        console.info(`${colors.green('STYLE BUILT')} All styles was build successfuly.`);
    }, () => {
        console.info(`${colors.red('STYLE BUILT')} Some styles get errors on build.`);
    });
}

module.exports = {
    buildStyleFromUIKit
};
