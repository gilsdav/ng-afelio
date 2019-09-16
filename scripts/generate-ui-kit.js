
const { join } = require('path');
const fse = require('fs-extra');
const util = require('util');
const pexec = util.promisify(require('child_process').exec);
const colors = require('colors');

const uiKitTypes = require('../models/ui-kit-types.enum');

function uiKitTask(type) {
  const currentPath = process.cwd();

  let templatePath;
  switch(type) {
    case uiKitTypes.BOOTSTRAP:
      templatePath = join(__dirname, '../templates/ui-kit-bootstrap');
      break;
    case uiKitTypes.AFELIO:
      templatePath = join(__dirname, '../templates/ui-kit-afelio');
      break;
    default:
      break;
  }
  
  console.log('templatePath', templatePath);
  if (templatePath) {
    return pexec('npm install bootstrap@4.1.3 font-awesome@4.7.0 --save').then(() => {
      return fse.copy(templatePath, `${currentPath}/projects/ui-kit/src`).then(() => {
        console.info(`${colors.green('APPLY TEMPLATE')} template of ui-kit '${type}' applied`);
      });
    });
  } else {
    console.info(`${colors.red('ERROR TEMPLATE')} template of ui-kit '${type}' not found`)
  }

  

}

function runUiKit() {
  return pexec('npx ng-afelio style');
}

module.exports = {
  fillUiKit: uiKitTask,
  runUiKit: runUiKit
};
