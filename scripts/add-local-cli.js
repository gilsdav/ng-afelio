const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const fs = require('fs');
const colors = require('colors');
const config = require('../config');

function addLocalCli(uiKit) {
    return pexec(config.production ? 'npm install ng-afelio --save-dev' : 'npm link ng-afelio').then(() => {
        const filePath = './package.json';
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonContent = JSON.parse(fileContent);
        jsonContent.scripts = {
            ng: 'ng',
            test: 'ng test',
            lint: 'ng lint',
            e2e: 'ng e2e',
            'ng-afelio': 'ng-afelio',
            build: 'ng-afelio build',
            ...(uiKit ? {
                start: 'ng-afelio start',
                style: 'ng-afelio style'
            } : {
                start: 'ng-afelio serve',
            })
        }
        fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
        console.info(`${colors.green('ADD SCRIPTS')} scripts added to package.json`);
    });
}

module.exports = addLocalCli;