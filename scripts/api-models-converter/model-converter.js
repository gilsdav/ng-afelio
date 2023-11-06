const fs = require('fs');
const colors = require('colors');
const mustache = require('mustache');
const readline = require('readline');

function generateModelsFromGeneratedApi(folderSource, outputFolder, apiName) {

    const modelsToConvertPath = folderSource;
    const modelsConvertedPath = outputFolder;
    const apiPath = apiName;

    return new Promise((resolve, reject) => {
        if(!fs.existsSync(modelsToConvertPath)) {
            reject();
        }
        createDirectory(modelsConvertedPath);
        const files = fs.readdirSync(modelsToConvertPath);
        for(const file in files){
            const fileName = files[file];
            const filePath = `${modelsToConvertPath}\\${fileName}`;
            if(!isDir(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                if (data.includes('export interface')) {
                    convertInterfaceToClass(filePath, modelsConvertedPath, fileName.replace('-dto.d.ts', '.model.ts'), apiPath)
                } else if (data.includes('export declare enum')) {
                    convertEnum(filePath, modelsConvertedPath, fileName.replace('-dto.d.ts', '.enum.ts'), apiPath)
                }
            }
        };
        console.info(colors.green('==== FINISHED ===='));
        console.info(` You can find the converted models/enums at: ${modelsConvertedPath} `);
        resolve();
    })

   
}

/**
 * Convert a DTO (interface) to a class (model)
 * @param {*} filePath the path of the dto to convert
 * @param {*} outputFile the path of the file which will contains the model
 */
function convertInterfaceToClass(filePath, outputFolder, outputFile, apiPath) {
    const templatesPath = '.\\scripts\\api-models-converter\\templates';

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });
    let lineExport = '';
    let linesProp = [];
    let linesImports = [];

    // For each line we define if it is an import, a property, or the declaration line
    rl.on('line', (line) => {
        if (line.includes('export interface')) {
            lineExport = line;
        } else if (line.includes('?:')) {
            linesProp.push(line);
        } else if (line.includes('import') && line.includes('./')) {
            linesImports.push(line);
        }
    }).on('close', function () {
        // As soon as we have handle all the lines, we use each variables to render the class upon a mustache template
        const dtoName = lineExport.replace('{', '').replace('export interface ', '').trim();
        const className = dtoName.replace('Dto', '');
        const imports = importsHandler(dtoName, linesImports, apiPath);
        const properties = classPropertiesHandler(imports, linesProp);
        const renderedClass = renderTemplate(`${templatesPath}\\class.mustache`, {
            className,
            dtoName,
            properties,
            imports
        });
        fs.writeFileSync(`${outputFolder}/${outputFile}`, renderedClass);
        rl.close();
    });

}

/**
 * Convert an enum from the API to an enum
 * @param {*} filePath the path of the enum to convert
 * @param {*} outputFile the path of the file which will contains the enum
 */
function convertEnum(filePath, outputFolder, outputFile, apiPath) {
    const templatesPath = '.\\scripts\\api-models-converter\\templates';

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });
    let lineExport = '';
    let linesProp = [];

    rl.on('line', (line) => {
        if (line.includes('export declare enum')) {
            lineExport = line;
        } else if (line.includes('=')) {
            linesProp.push(line);
        }
    }).on('close', function () {
        const dtoName = lineExport.replace('{', '').replace('export declare enum ', '').trim();
        const className = `${dtoName.replace('Dto', '')}Enum`;
        const imports = [{
            path: apiPath,
            name: dtoName
        }]
        const properties = enumPropertiesHandler(linesProp);
        const renderedClass = renderTemplate(`${templatesPath}\\enum.mustache`, {
            className,
            dtoName,
            properties,
            imports
        });

        fs.writeFileSync(`${outputFolder}/${outputFile}`, renderedClass);
        rl.close();
    });

}

/**
 * Maps the imports to an array of objects needed for the mustache template
 * @param {*} dtoName the name of the dto used to add the import for the API 
 * @param {*} linesImports all the imports needed
 * @returns the imports used for the mustache template
 */
function importsHandler(dtoName, linesImports, apiPath) {
    const imports = linesImports.map(i => {
        return {
            path: i.substring(
                i.lastIndexOf("from '") + 6,
                i.lastIndexOf("'")
            ).replace('-dto', '.model').trim(),
            name: i.substring(
                i.lastIndexOf("{") + 1,
                i.lastIndexOf("}")
            ).replace('Dto', '').trim()
        }
    });

    imports.unshift({
        path: apiPath,
        name: dtoName
    });
    return imports;
}

/**
 * Map the properties of the DTO to an array of objects needed for the mustache template
 * @param {*} imports the imports (used to know if a property is nested)
 * @param {*} linesProp the properties to map
 * @returns the properties used for the mustache template
 */
function classPropertiesHandler(imports, linesProp) {
    const properties = linesProp.map((p, i) => {
        const split = p.split('?:');
        const type = split[1].replace(';', '').replace("Dto", "").replace("null |", "").replace("| null", "").trim();
        const name = split[0].trim();
        const isArr = type.includes('Array<');
        const isNullable = split[1].includes('null');
        const typeClear = isArr ? type.replace('Array<', '').replace('>', '') : type;
        var nestedType = imports.find(f => f.name === typeClear)
        return {
            name: name,
            type: type,
            isLast: i === linesProp.length - 1,
            isNested: nestedType != null,
            isArray: isArr,
            typeNotArray: typeClear,
            isNullable: isNullable
        }
    });

    return properties;
}

/**
 * Map the enum keys - values to an array of objects needed for the mustache template
 * @param {*} linesProp the properties to map
 * @returns the enum key - values used for the mustache template
 */
function enumPropertiesHandler(linesProp) {
    const properties = linesProp.map((p, i) => {
        const split = p.split('=');
        const value = split[1].replace('"', '').replace(",", "").trim();
        const key = split[0].trim();
        return {
            value: value,
            key: key,
            isLast: i == linesProp.length - 1,
            isNested: false,
            isArray: false,
            typeNotArray: null,
            isNullable: false
        }
    });

    return properties;
}

/**
 * Render a mustache template
 * @param {*} filePath the path of the mustache template
 * @param {*} variables an object which contains the variables needed by the template
 * @returns the rendered mustache template
 */
function renderTemplate(filePath, variables) {
    const template = fs.readFileSync(filePath, 'latin1');
    template.replace(/\{\{([^\}]*)\}\}/g, '{{{$1}}}');
    const rendered = mustache.render(template, variables);
    return rendered;
}

/**
 * Create a directory if it does not exist
 * @param {*} path the path of the directory to create
 */
function createDirectory(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

/**
 * Check if a path is a directory
 * @param {*} the path 
 * @returns true if it is a directory, false otherwise
 */
function isDir(path) {
    try {
        var stat = fs.lstatSync(path);
        return stat.isDirectory();
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}

module.exports = generateModelsFromGeneratedApi;
