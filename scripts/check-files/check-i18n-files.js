const path = require('path');
const fs = require('fs');
const colors = require('colors');
const { flatten, diff, getConfig } = require('./util');

const defaultFile = 'fr.json';

function checkIfFilesExists(currentPath, file) {
    return fs.existsSync(path.join(currentPath, file));
}

function getListOfLocalFiles(currentPath) {
    const reg = /.json$/;
    return fs.readdirSync(currentPath).filter(path => {
        return reg.test(path);
    });
}


function checkDiff(mainFileContent, otherFileContent) {
    const obj1 = JSON.parse(mainFileContent);
    const obj2 = JSON.parse(otherFileContent);

    const obj1Keys = Object.keys(flatten(obj1));
    const obj2Keys = Object.keys(flatten(obj2));

    return {
        less: diff(obj1Keys, obj2Keys),
        more: diff(obj2Keys, obj1Keys)
    }
}

function toConsoleText(diffs) {
    let text = '';
    for (const fileKey in diffs) {
        if (diffs.hasOwnProperty(fileKey)) {
            const fileDiffs = diffs[fileKey];
            text += `${colors.cyan(fileKey)}\n`;
            if (fileDiffs.more.length > 0) {
                text += `${colors.green('+')} ${fileDiffs.more.join(', ')}\n`;
            }
            if (fileDiffs.less.length > 0) {
                text += `${colors.red('-')} ${fileDiffs.less.join(', ')}\n`;
            }
        }
    }
    return text;
}

function checkFiles(mainFile) {
    if (!mainFile) {
        const config = getConfig('i18n');
        mainFile = config && config.mainFile || defaultFile;
    }
    const currentPath = process.cwd();
    return new Promise((resolve, reject) => {
        const diffs = {};
        if (checkIfFilesExists(currentPath, mainFile)) {
            const filesToCheck = getListOfLocalFiles(currentPath).filter(name => name !== mainFile);
            const mainFileConent = fs.readFileSync(mainFile).toString();
            filesToCheck.forEach(fileName => {
                diffs[fileName] = checkDiff(mainFileConent, fs.readFileSync(fileName).toString());
            });
            console.log(toConsoleText(diffs));
            resolve(diffs);
        } else {
            console.error(colors.red(`Can not found "${mainFile}" in this directory. Go into the "assets/locales" directory before using this command.`));
            reject();
        }
    });
}

function alignWith(base, target, suffix) {
    let result = {};
    Object.keys(base).forEach((baseKey) => {
        const targetValue = target ? target[baseKey] : null;
        if (typeof base[baseKey] === 'object') {
            result[baseKey] = alignWith(base[baseKey], targetValue, suffix);
        } else {
            const isPresentInTarget = !!targetValue;
            result[baseKey] = isPresentInTarget ? targetValue : base[baseKey] + suffix;
        }
    });
    return result;
}

function fixI18n(mainFile) {
    if (!mainFile) {
        const config = getConfig('i18n');
        mainFile = config && config.mainFile || defaultFile;
    }
    const mainFileContent = JSON.parse(fs.readFileSync(mainFile).toString());
    const otherFiles = getListOfLocalFiles(process.cwd()).filter((f) => f !== mainFile);
    otherFiles.forEach((otherFile) => {
        const otherFileContent = JSON.parse(fs.readFileSync(otherFile).toString() || '{}');
        const result = alignWith(mainFileContent, otherFileContent, '_' + otherFile.substring(0, otherFile.indexOf('.')));
        fs.writeFileSync(otherFile, JSON.stringify(result, undefined, 4));
    });
}

module.exports = { checkFiles, fixI18n };
