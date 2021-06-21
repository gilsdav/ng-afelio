const path = require('path');
const fs = require('fs');
const { set, get, omit } = require('lodash');

function generateI18n(diff, mainFile) {
    const currentPath = process.cwd();
    const mainFileContent = JSON.parse(fs.readFileSync(`${currentPath}/${mainFile}`));

    Object.keys(diff).forEach((file) => {
        const filePath = path.join(currentPath, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath));
        let result = { ...fileContent };
        const fileDiff = diff[file];
        const toAdd = fileDiff.less;
        const toRemove = fileDiff.more;
        toAdd.forEach((keyToAdd) => {
            const suffix = `_${file.replace('.json', '')}`;
            const valueToAdd = `${get(mainFileContent, keyToAdd)}${suffix}`;
            set(result, keyToAdd, valueToAdd);
        });
        result = omit(result, toRemove);
        fs.writeFileSync(filePath, JSON.stringify(result, undefined, 4));
    });

};

module.exports = generateI18n;
