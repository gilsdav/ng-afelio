const cli = require('@angular/cli');
const { Bundler } = require('scss-bundle');
const fs = require('fs');
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

    });
  }
  
  module.exports = buildStyleFromUIKit;
