const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const fs = require('fs');
const colors = require('colors');
const http = require('request');
const path = require('path')

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
        [scriptName]: `ng-afelio api -r ${configFileName}`
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    return pexec('npm install ng-swagger-gen --save-dev');
}

/**
 * @param {string} source 
 * @param {string} destination 
 * @param {string} fileName 
 * @param {string} moduleName 
 * @param {string} originalPath original path if source is a local copy (optional)
 * @param {string} apiKey api key to get swagger config (optional)
 */
function generateConfig(source, destination, fileName, moduleName, originalPath, apiKey) {
    return pexec(`npm run ng-swagger-gen -- --gen-confi -i ${source} -o ${destination} -c ${fileName}`).then(() => {
        const filePath = `./${fileName}`;
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonContent = JSON.parse(fileContent);
            jsonContent.prefix = moduleName;
            jsonContent.defaultTag = moduleName;
            if (originalPath) {
                jsonContent.originalSwagger = originalPath;
            }
            if (originalPath) {
                jsonContent.APIKey = apiKey;
            }
            fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
        } else {
            console.log(`${colors.red(`${fileName} generation error`)} can not create the swagger config file`);
        }
    });
}

function getConfigFromSecureSource(source, apiKey, fileName) {
    return new Promise((resolve, reject) => {
        http.get({
            url: source,
            headers: {
                'Authorization': apiKey
            }
        }, (err, res, body) => {
            if (err || res.statusCode !== 200) {
                console.log(`${colors.red(`${source} not reachable`)} can not get swagger config file`);
                reject();
            } else {
                const content = body;
                const filePath = `./src/assets/${fileName}.swag`; // ${path.extname(source)}
                fs.writeFile(filePath, content, 'utf8', (err) => {
                    if (!err) {
                        resolve(filePath);
                    } else {
                        console.log(`${colors.red(`Swagger config storaeg error`)} not able to create ${filePath}`);
                        reject();
                    }
                });
                
            }
        });
    });
    
}

function generateProtectedConfig(source, destination, fileName, moduleName, apiKey) {
    return getConfigFromSecureSource(source, apiKey, fileName).then((path) => {
        return generateConfig(path, destination, fileName, moduleName, source, apiKey);
    });
}

function generateApiFiles(source) {
    return pexec(`npm run ng-swagger-gen -- -c ${source}`);
}

function generateSwagger(source, name, apiKey) {
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
        let configGeneration;
        if (apiKey) {
            configGeneration = generateProtectedConfig(source, destination, configFileName, moduleName, apiKey);
        } else {
            configGeneration = generateConfig(source, destination, configFileName, moduleName);
        }
        configGeneration.then(() => {
            return generateApiFiles(configFileName).then(() => {
                console.info(`${colors.green('Swagger generated')} and new script 'npm run ${regenerateScriptName}' added.`);
                console.info(`${colors.blue('Please')} don't forget to import '${moduleName}Module' into your 'AppModule'.`);
            });
        });
    });

}

function regenerateSwagger(source) {
    if (!fs.existsSync(source)) {
        console.log(`${colors.red(`Swagger config does not exist`)} can not find ${source}`);
        return;
    }

    const fileContent = fs.readFileSync(source, 'utf8');
    const jsonContent = JSON.parse(fileContent);
    const fileName = path.basename(source);

    let configSearch;
    if (jsonContent.originalSwagger && jsonContent.APIKey) {
        configSearch = getConfigFromSecureSource(jsonContent.originalSwagger, jsonContent.APIKey, fileName).then(() => {
            console.info(`${colors.green('New Swagger file pulled')} from ${jsonContent.originalSwagger}`);
        });
    } else {
        configSearch = Promise.resolve(false);
    }

    configSearch.then(() => {
        return generateApiFiles(source)
            .then(() => {
                console.info(`${colors.green('Swagger regenerated')} from ${source}`);
            });
    });

}

module.exports = {
    generateSwagger,
    regenerateSwagger
};
