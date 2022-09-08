const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const fs = require('fs');
const colors = require('colors');
const http = require('request');
const path = require('path');
const fse = require('fs-extra');
const { join } = require('path');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function toPascalCase(str) {
    let result = '';
    if (str) {
        result = str.replace(/\W+(.)/g, function (match, chr) {
            return chr.toUpperCase();
        });
        result = capitalizeFirstLetter(result);
    }
    return result;
}

function toSnakeCase(str) {
    return str.replace(/(?:^|\.?)([A-Z])/g, function (x, y) {
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
    if (jsonContent.devDependencies['ng-swagger-gen']) {
        console.info(`NgSwaggerGen found in your project (${jsonContent.devDependencies['ng-swagger-gen']}). We are using your current version.`);
        return Promise.resolve();
    } else {
        console.info('Installing NgSwaggerGen');
        return pexec('npm install ng-swagger-gen@1.6.1 --save-dev');
    }
}

function installOpenapiGen(scriptName, configFileName) {
    const filePath = './package.json';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonContent = JSON.parse(fileContent);

    jsonContent.scripts = {
        ...jsonContent.scripts,
        'ng-swagger-gen': 'ng-openapi-gen',
        [scriptName]: `ng-afelio api -r ${configFileName}`
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    if (jsonContent.devDependencies['ng-openapi-gen']) {
        console.info(`NgOpenapiGen found in your project (${jsonContent.devDependencies['ng-openapi-gen']}). We are using your current version.`);
        return Promise.resolve();
    } else {
        console.info('Installing NgOpenapiGen');
        return pexec('npm install ng-openapi-gen@0.2.3 --save-dev');
    }
}

/**
 * @param {string} source
 * @param {string} destination
 * @param {string} fileName
 * @param {string} moduleName
 * @param {string} originalPath original path if source is a local copy (optional)
 * @param {string} apiKey api key to get swagger config (optional)
 */
function generateConfigSwagger(source, destination, fileName, moduleName, originalPath, apiKey, proxy) {
    console.info('Generating Swagger configuration file');
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
            if (apiKey) {
                jsonContent.APIKey = apiKey;
            }
            if (proxy) {
                jsonContent.proxy = proxy;
            }
            fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
        } else {
            console.log(`${colors.red(`${fileName} generation error`)} can not create the swagger config file`);
        }
    });
}

/**
 * @param {string} source
 * @param {string} destination
 * @param {string} fileName
 * @param {string} moduleName
 * @param {string} originalPath original path if source is a local copy (optional)
 * @param {string} apiKey api key to get swagger config (optional)
 */
function generateConfigOpenApi(source, destination, fileName, moduleName, originalPath, apiKey, proxy) {
    console.info('Generating OpenApi configuration file');
    const currentPath = process.cwd();
    const templatePath = join(__dirname, '../templates/open-api/ng-openapi-gen.json');
    const configFileName = join(currentPath, fileName);

    return fse.copy(templatePath, configFileName).then(() => {
        console.info(`${colors.green('APPLY TEMPLATE')} template of open-api applied`);
        const filePath = `./${fileName}`;
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonContent = JSON.parse(fileContent);
            jsonContent.input = source;
            jsonContent.output = destination;
            jsonContent.module = `${moduleName}Module`;
            jsonContent.configuration = `${moduleName}Configuration`;
            if (originalPath) {
                jsonContent.originalSwagger = originalPath;
            }
            if (apiKey) {
                jsonContent.APIKey = apiKey;
            }
            if (proxy) {
                jsonContent.proxy = proxy;
            }
            fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
        } else {
            console.log(`${colors.red(`${fileName} generation error`)} can not create the swagger config file`);
        }
    });
}

function getConfigFromSecureSource(source, apiKey, fileName, proxy) {
    return new Promise((resolve, reject) => {
        http.get({
            url: source,
            headers: {
                'Authorization': apiKey
            },
            proxy: proxy
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

function generateProtectedConfigSwagger(source, destination, fileName, moduleName, apiKey, proxy) {
    return getConfigFromSecureSource(source, apiKey, fileName, proxy).then((path) => {
        return generateConfigSwagger(path, destination, fileName, moduleName, source, apiKey, proxy);
    });
}

function generateProtectedConfigOpenApi(source, destination, fileName, moduleName, apiKey, proxy) {
    return getConfigFromSecureSource(source, apiKey, fileName, proxy).then((path) => {
        return generateConfigOpenApi(path, destination, fileName, moduleName, source, apiKey, proxy);
    });
}

function generateApiFiles(source) {
    return new Promise((resolve, reject) => {
        pexec(`npm run ng-swagger-gen -- -c ${source}`).then(({ stdout, stderr }) => {
            if (stdout) {
                console.info(`${colors.cyan(stdout)}`);
            }
            if (stderr) {
                console.error(`${colors.red(stderr)}`);
                reject('Error during API generation. Look at previous logs to understand the error.');
            } else {
                resolve();
            }
        });
    })
}

const installations = {
    '2': installSwaggerGen,
    '3': installOpenapiGen
};

const generateConfigs = {
    '2': {
        simple: generateConfigSwagger,
        secure: generateProtectedConfigSwagger
    },
    '3': {
        simple: generateConfigOpenApi,
        secure: generateProtectedConfigOpenApi
    }
};

async function generateSwagger(source, name, apiKey, extract, version, proxy) {
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

    const installator = installations[version];
    if (installator) {
        const generator = installator(regenerateScriptName, configFileName);

        await generator.then(() => {
            const generateConfig = generateConfigs[version];
            let configGeneration;
            if (apiKey) {
                configGeneration = generateConfig.secure(source, destination, configFileName, moduleName, apiKey, proxy);
            } else if (extract || proxy) {
                configGeneration = generateConfig.secure(source, destination, configFileName, moduleName, '', proxy);
            } else {
                configGeneration = generateConfig.simple(source, destination, configFileName, moduleName);
            }
            return configGeneration.then(() => {
                return generateApiFiles(configFileName).then(() => {
                    console.info(`${colors.green('Swagger generated')} and new script 'npm run ${regenerateScriptName}' added.`);
                    console.info(`${colors.blue('Please')} don't forget to import '${moduleName}Module' into your 'AppModule'.`);
                });
            });
        });
    } else {
        console.log(`${colors.red(`Version ${version} ${configFileName} is not supported`)}. Please use one of these: ${Object.keys(installations).join(',')}`);
    }
}

async function regenerateSwagger(source) {
    if (!fs.existsSync(source)) {
        console.log(`${colors.red(`Swagger config does not exist`)} can not find ${source}`);
        return;
    }

    const fileContent = fs.readFileSync(source, 'utf8');
    const jsonContent = JSON.parse(fileContent);
    const fileName = path.basename(source);

    let configSearch;
    if (jsonContent.originalSwagger) {
        configSearch = getConfigFromSecureSource(jsonContent.originalSwagger, jsonContent.APIKey || '', fileName, jsonContent.proxy || undefined).then(() => {
            console.info(`${colors.green('New Swagger file pulled')} from ${jsonContent.originalSwagger}`);
        });
    } else {
        configSearch = Promise.resolve(false);
    }

    await configSearch.then(() => {
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
