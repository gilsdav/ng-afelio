const cli = require('@angular/cli');
const { Bundler } = require('scss-bundle');
const fs = require('fs');
// const fse = require('fs-extra');
const decomment = require('decomment');
const colors = require('colors');

const sass = require('node-sass');
// const magicImporter = require('node-sass-magic-importer');

const cssNodeExtract = require('css-node-extract');
const postcssScssSyntax = require('postcss-scss');

function buildStyleFromUIKit() {
    const currentPath = process.cwd();
    // const templatePath = join(__dirname, '../templates/module');

    const bundler = new Bundler(undefined, currentPath);

    return bundler.Bundle("./src/styles.scss").then(result => {

        const outputDirectory = '../../styles';

        if (!fs.existsSync(outputDirectory)){
            fs.mkdirSync(outputDirectory);
        }

        const toWrite = decomment.text(result.bundledContent/*, {safe: true}*/);

        // fs.writeFileSync(`${outputDirectory}/main.scss`, toWrite);
        // console.info(`${colors.green('BUILD')} the file was saved in "/styles/main.scss"`);

        // extract non css features
        const options = {
            css: toWrite,
            filters: ['silent'],
            postcssSyntax: postcssScssSyntax
        };
        cssNodeExtract.process(options).then((extractedCss) => {
            fs.writeFile(`${outputDirectory}/style-utils.scss`, extractedCss, function(err){
                if(!err){
                    console.info(`${colors.green('BUILD style utils')} was saved in "/styles/style-utils.scss"`);
                } else {
                    console.info(colors.red('WRITE FILE ERROR style-utils.scss'), err);
                }
            });
        }, err => {
            console.info(colors.red('BUILD ERROR style-utils.scss'), err);
        });

        // build global style
        sass.render({
            // importer: magicImporter(),
            data: toWrite, // [silent] from  
            outFile: `${outputDirectory}/main.scss`,
        }, (err, result) => {
            if(!err) {
                fs.writeFile(`${outputDirectory}/main.scss`, result.css, function(err){
                    if(!err){
                        console.info(`${colors.green('BUILD global style')} was saved in "/styles/main.scss"`);
                    } else {
                        console.info(colors.red('WRITE FILE ERROR main.scss'), err);
                    }
                });
            } else {
                console.info(colors.red('BUILD ERROR main.scss'), err);
            }
        });


        const toAddToStyleScss = '@import \'../styles/main\';';
        const stylePath = '../../src/styles.scss';
        const fileContent = fs.readFileSync(stylePath, 'utf8');
        if (!fileContent.includes(toAddToStyleScss)) {
            fs.appendFileSync(stylePath, `\n${toAddToStyleScss}\n`);
            console.info(`${colors.green('ADDED')} "${toAddToStyleScss}" added into "/src/styles.scss"`);
        }

    }).then(() => {
        const toAddToAngularConfig = { "input": "projects/ui-kit/src/assets", "glob": "**/*", "output": "./assets" };
        const angularConfigPath = '../../angular.json';
        const fileContent = fs.readFileSync(angularConfigPath, 'utf8');
        if (!fileContent.includes('"input": "projects/ui-kit/src/assets"')) {
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
    });
    
    /*.then(() => {
        const sourceDirectory = './src/assets';
        const outputDirectory = '../../src/assets';
        return fse.copy(sourceDirectory, outputDirectory)
            .then(() => console.info(`${colors.green('COPIED')} all assets are copied`));
    });*/
  }
  
  module.exports = buildStyleFromUIKit;
