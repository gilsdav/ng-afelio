const cli = require('@angular/cli');
const { Bundler } = require('scss-bundle');
const fs = require('fs');
// const fse = require('fs-extra');
const decomment = require('decomment');
const colors = require('colors');

const sass = require('node-sass');
const magicImporter = require('node-sass-magic-importer');

const cssNodeExtract = require('css-node-extract');
const postcssScssSyntax = require('postcss-scss');

const path = require('path');

const baseConfig = require('../templates/config/ng-afelio.json');
const configPath = 'ng-afelio.json';

let outputDirectory = '../../styles';
let inputDirectory = './projects/ui-kit';
let angularConfigPath = '../../angular.json';

function readConfig() {
    if(!fs.existsSync(configPath)) {
        writeConfig(baseConfig);
    }
    const fileContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(fileContent);
}

function writeConfig(jsonContent) {
    fs.writeFileSync(configPath, JSON.stringify(jsonContent, null, 2), 'utf8');
}

function initFolder(config) {
    inputDirectory = config.style.baseInputDirectory || inputDirectory;
    process.chdir(inputDirectory);

    outputDirectory = config.style.baseOutputDirectory || outputDirectory;
    if (!fs.existsSync(outputDirectory)){
        fs.mkdirSync(outputDirectory);
    }

    // Angular config
    const countSlashes = inputDirectory.replace('./', '').split('/').reduce((result) => {
        return result += '../';
    }, '');
    angularConfigPath = `${countSlashes}angular.json`;
}

function buildUtils(config, bundler) {
    const enabled = (config && config.style && config.style.styleUtils && config.style.styleUtils.enable);
    if (enabled) {
        const input = (config && config.style && config.style.styleUtils && config.style.styleUtils.input) || 'styles.scss';
        const output = (config && config.style && config.style.styleUtils && config.style.styleUtils.output) || 'style-utils.scss';
        return bundler.Bundle(path.join('./src/', input)).then(result => {
            const toWrite = decomment.text(result.bundledContent/*, {safe: true}*/);
            const options = {
                css: toWrite,
                filters: ['silent'],
                postcssSyntax: postcssScssSyntax
            };
            return cssNodeExtract.process(options).then((extractedCss) => {
                const outputPath = path.join(outputDirectory, output);
                fs.writeFile(outputPath, extractedCss, function(err){
                    if(!err){
                        console.info(`${colors.green('BUILD style utils')} was saved in "${outputPath}"`);
                    } else {
                        console.info(colors.red(`WRITE FILE ERROR ${output}`), err);
                    }
                });
            }, err => {
                console.info(colors.red(`BUILD ERROR ${output}`), err);
            });
        });
    } else {
        return Promise.resolve(false);
    }
}

function buildStyleFiles(config, bundler) {
    const files = (config && config.style && config.style.files) || [{ "input": "styles.scss", "output": "main.scss" }];
    
    return files.map(file => {
        const input = file.input;
        const output = file.output || file.input;
        const isGlobal = file.global;

        return bundler.Bundle(path.join('./src/', input)).then(result => {
            const toWrite = decomment.text(result.bundledContent/*, {safe: true}*/);
            const outputPath = path.join(outputDirectory, output);

            const cwd = process.cwd();
            process.chdir(path.dirname(path.join(process.cwd(), './src/', input)));

            sass.render({
                importer: magicImporter(),
                data: toWrite, // [silent] from  
                outFile: outputPath,
            }, (err, result) => {
                if(!err) {
                    fs.writeFile(outputPath, result.css, function(err){
                        if(!err){
                            console.info(`${colors.green(`BUILD ${isGlobal ? 'global ' : ''}style`)} was saved in "${outputPath}"`);
                        } else {
                            console.info(colors.red(`WRITE FILE ERROR ${outputPath}`), err);
                        }
                    });
                } else {
                    console.info(colors.red(`BUILD ERROR ${outputPath}`), err);
                }
            });

            process.chdir(cwd);

            if (isGlobal) {
                const fileName = output.substring(0, output.lastIndexOf('.'));

                const toAddToStyleScss = `@import '../styles/${output}';`;
                const stylePath = '../../src/styles.scss';
                const fileContent = fs.readFileSync(stylePath, 'utf8');
                if (!fileContent.includes(toAddToStyleScss)) {
                    fs.appendFileSync(stylePath, `${toAddToStyleScss}`);
                    console.info(`${colors.green('ADDED')} "${toAddToStyleScss}" added into "/src/styles.scss"`);
                }
            }

        });
    });
}

function checkAssetsConfiguration() {
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

function checkStyleShortcut() {
    const stylePath = path.join(inputDirectory, outputDirectory);
    const fileContent = fs.readFileSync(angularConfigPath, 'utf8');
    if (!fileContent.includes('"stylePreprocessorOptions"')) {
        const jsonContent = JSON.parse(fileContent);
        const defaultProject = jsonContent.defaultProject;
        const buildOptions = jsonContent.projects[defaultProject].architect.build.options;
        buildOptions.stylePreprocessorOptions = { includePaths: [stylePath] };
        fs.writeFileSync(angularConfigPath, JSON.stringify(jsonContent, null, 2), 'utf8');
        console.info(`${colors.green('ADD CSS SHORTCUT')} "styles" chortchut added to ${defaultProject} project`);
    }
}

function buildStyleFromUIKit() {
    const config = readConfig();

    initFolder(config);

    const currentPath = process.cwd();

    const bundler = new Bundler(undefined, currentPath);

    return Promise.all([
        buildUtils(config, bundler),
        ...buildStyleFiles(config, bundler)
    ]).then(() => {
        checkAssetsConfiguration();
        checkStyleShortcut();
    });
  }
  
module.exports = buildStyleFromUIKit;
