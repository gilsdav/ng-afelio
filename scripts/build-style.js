const cli = require('@angular/cli');
const { Bundler } = require('scss-bundle');
const fs = require('fs');
// const fse = require('fs-extra');
const decomment = require('decomment');
const colors = require('colors');

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

        fs.writeFileSync(`${outputDirectory}/main.scss`, toWrite);
        console.info(`${colors.green('BUILD')} the file was saved in "/styles/main.scss"`);

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
