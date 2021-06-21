const path = require('path');
const fs = require('fs');
const colors = require('colors');
const { flatten, diff } = require('./util');

function checkIfFilesExists(currentPath) {
    return fs.existsSync(path.join(currentPath, 'environment.ts'));
}

function getListOfEnvFiles(currentPath) {
    const reg = /environment(\..*)?.ts$/;
    return fs.readdirSync(currentPath).filter(path => {
        return reg.test(path);
    });
}

function checkDiff(mainFileContent, otherFileContent) {
    const reg = /export const environment = (\{[\s\S]*\});/;
    const fixNoValueReg = /(?:[^$])[,|{][\s]*([\w]*)[\s]*[,|}]/g;
    const fixNoValue = (text) => text.match(reg)[1].replace(fixNoValueReg, (data, match) => { return data.replace(match, `${match}: 'temp'`) });
    const obj1Str = fixNoValue(mainFileContent);
    const obj2Str = fixNoValue(otherFileContent);
    
    const obj1 = eval(`(${obj1Str})`);
    const obj2 = eval(`(${obj2Str})`);

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
    const currentPath = process.cwd();
    return new Promise((resolve, reject) => {
        const diffs = {};
        if (checkIfFilesExists(currentPath)) {
            const filesToCheck = getListOfEnvFiles(currentPath).filter(name => name !== mainFile);
            const mainFileConent = fs.readFileSync(mainFile).toString();
            filesToCheck.forEach(fileName => {
                diffs[fileName] = checkDiff(mainFileConent, fs.readFileSync(fileName).toString());
            });
            console.log(toConsoleText(diffs));
            resolve(diffs);
        } else {
            console.error(colors.red(`Can not found "environment.ts" in this directory. Go into the "environment" directory before using this command.`));
            reject();
        }
    });
}
  
module.exports = checkFiles;
