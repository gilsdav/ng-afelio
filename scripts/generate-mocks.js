
const { join } = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const colors = require('colors');

function generateMocksTask() {
  const currentPath = process.cwd();
  const templatePath = join(__dirname, '../templates/mocks');

  const exist = fs.existsSync(`${currentPath}/mocks`);

  if (exist) {
    console.log(`${colors.red('mocks folder already exist')}`);
    return;
  }
  

  return fse.copy(templatePath, `${currentPath}/mocks`).then(() => {
    const filePath = './environments/environment.ts';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const newContent = fileContent.replace(
      '\n};',
      `,
  mock: {
    enable: true,
    all: false,
    services: {
      getPets: true
    }
  }
};
`);

  fs.writeFileSync(filePath, newContent, 'utf8');

  console.info(`${colors.green('Mock system added')} only environment.ts is updated. Update other environment files.`);
  console.info(`Add this provider into your app.module.ts :`);
  console.info(`${colors.blue('...(environment.mock.enable ? [mockInterceptorProvider] : [])')}`);
  
    

  });

}

module.exports = generateMocksTask;
