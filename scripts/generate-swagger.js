const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const fs = require('fs');
const colors = require('colors');

const destination = './src/api';

function generateSwagger(source) {

    if (fs.existsSync('./ng-swagger-gen.json')) {
        console.log(`${colors.red('ng-swagger-gen.json already exist')} please use 'npm run regenerate-api' to regenerate files.`);
        return;
    }

    const filePath = './package.json';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonContent = JSON.parse(fileContent);

    jsonContent.scripts = {
        ...jsonContent.scripts,
        'regenerate-api': 'ng-swagger-gen'
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    
    return pexec('npm install ng-swagger-gen --save-dev').then(() => {
        return pexec(`npm run regenerate-api -- --gen-confi -i ${source} -o ${destination}`).then(() => {
            return pexec('npm run regenerate-api').then(() => {
                console.info(`${colors.green('Swagger generated')} and new script 'npm run regenerate-api' added.`);
                console.info(`${colors.blue('Please')} don't forget to import 'ApiModule' into your 'AppModule'.`);
            });
        });
    });
}

module.exports = generateSwagger;
