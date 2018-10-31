const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const fs = require('fs');
const colors = require('colors');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function toPascalCase(str) {
    let result = '';
    if (str) {
        result = str.replace(/\W+(.)/g, function(match, chr) {
            return chr.toUpperCase();
        });
        result = capitalizeFirstLetter(result);
    }
    return result;
}

function toSnakeCase(str) {
    return str.replace(/(?:^|\.?)([A-Z])/g, function (x,y){
        return '-' + y.toLowerCase();
    }).replace(/^-/, '').replace(/ /g, '');
}

function installSwaggerGen(scriptName, configFileName) {
    const filePath = './package.json';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonContent = JSON.parse(fileContent);

    jsonContent.scripts = {
        ...jsonContent.scripts,
        'ng-swagger-gen': 'ng-swagger-gen',
        [scriptName]: `ng-swagger-gen -c ${configFileName}`
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    return pexec('npm install ng-swagger-gen --save-dev');
}

function generateConfig(source, destination, fileName, moduleName) {
    return pexec(`npm run ng-swagger-gen -- --gen-confi -i ${source} -o ${destination} -c ${fileName}`).then(() => {
        const filePath = `./${fileName}`;
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonContent = JSON.parse(fileContent);
            jsonContent.prefix = moduleName;
            jsonContent.defaultTag = moduleName;
            fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
        } else {
            console.log(`${colors.red(`${fileName} generation error`)} can not create the swagger config file`);
        }
    });
}

function generateApiFiles(scriptName) {
    return pexec(`npm run ${scriptName}`);
}

function generateSwagger(source, name) {
    if (!name) {
        name = 'api';
    }

    const configFileName = `ng-swagger-gen-${toSnakeCase(name)}.json`;
    const destination = `./src/${toSnakeCase(name)}`;
    const moduleName = toPascalCase(name);
    const regenerateScriptName = `regenerate-${toSnakeCase(name)}`;

    if (fs.existsSync(`./${configFileName}`)) {
        console.log(`${colors.red(`${configFileName} already exist`)} please use 'npm run ${regenerateScriptName}' to regenerate files.`);
        return;
    }

    return installSwaggerGen(regenerateScriptName, configFileName).then(() => {
        return generateConfig(source, destination, configFileName, moduleName).then(() => {
            return generateApiFiles(regenerateScriptName).then(() => {
                console.info(`${colors.green('Swagger generated')} and new script 'npm run ${regenerateScriptName}' added.`);
                console.info(`${colors.blue('Please')} don't forget to import '${moduleName}Module' into your 'AppModule'.`);
            });
        });
    });

}

module.exports = generateSwagger;
