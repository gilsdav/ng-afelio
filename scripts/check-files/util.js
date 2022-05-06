const fs = require('fs');
const { join, sep } = require('path');
const colors = require('colors');

function traverseAndFlatten(currentNode, target, flattenedKey) {
    for (var key in currentNode) {
        if (currentNode.hasOwnProperty(key)) {
            var newKey;
            if (flattenedKey === undefined) {
                newKey = key;
            } else {
                newKey = flattenedKey + '.' + key;
            }

            var value = currentNode[key];
            if (typeof value === "object") {
                traverseAndFlatten(value, target, newKey);
            } else {
                target[newKey] = value;
            }
        }
    }
}

function flatten(obj) {
    var flattenedObject = {};
    traverseAndFlatten(obj, flattenedObject);
    return flattenedObject;
}

function diff(keys1, keys2) {
    return keys1.filter(function(i) {return keys2.indexOf(i) < 0;});
}

function findConfigFile() {
    const currentPath = process.cwd();
    let decomposedCurrentPath = currentPath.split(new RegExp(`[\\${sep}]`, 'g'));
    if (decomposedCurrentPath[0] === '') {
        decomposedCurrentPath[0] = '/';
    }
    while (decomposedCurrentPath.length > 1 && decomposedCurrentPath.join('/')) {
        const pathToTest = join(...decomposedCurrentPath, 'ng-afelio.json');
        if(fs.existsSync(pathToTest)) {
            return pathToTest;
        } else {
            decomposedCurrentPath.pop();
        }
    }
    console.warn(colors.yellow('No `ng-afelio.json` file found.'));
}

function getConfig(type) {
    const configFilePath = findConfigFile();
    if (configFilePath) {
        const configContent = JSON.parse(fs.readFileSync(configFilePath));
        return configContent[type];
    }
}

module.exports = {
    flatten,
    diff,
    getConfig
};
