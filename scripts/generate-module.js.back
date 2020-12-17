
const { join } = require('path');
const fse = require('fs-extra');
const colors = require('colors');

function generateModuleTask(name, needStore, light) {
  const currentPath = process.cwd();
  const templatePath = join(__dirname, '../templates/module');

  fse.copy(templatePath, `${currentPath}/${name}`, {
    filter: function (path) {
      if (path.endsWith('store') && !needStore) {
        return false;
      }
      if (
        light && (
          path.endsWith('containers') ||
          path.endsWith('guards')
        )
      ) {
        return false;
      }
      return true;
    }
  });
  console.info(`${colors.green('APPLY TEMPLATE')} template of module applied`);
}

module.exports = generateModuleTask;
