const path = require('path');
const fs = require('fs');
const colors = require('colors');
const { flatten, diff } = require('./util');

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
  
module.exports = checkFiles;
