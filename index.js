#!/usr/bin/env node

const program = require('commander');
const colors = require('colors');
const packageJson = require('./package.json');

const { 
  createNewProject,
  getAngularVersion,
  serveUIKit,
  serveMain,
  generate,
  build,
  buildStyle,
  generateMocks,
  generateApi,
  regenerateApi
} = require('./logic');

const version = colors.cyan(`
                            _                        __     _ _          _____ _      _____ 
    /\\                     | |                /\\    / _|   | (_)        / ____| |    |_   _|
   /  \\   _ __   __ _ _   _| | __ _ _ __     /  \\  | |_ ___| |_  ___   | |    | |      | |  
  / /\\ \\ | '_ \\ / _  | | | | |/ _  | '__|   / /\\ \\ |  _/ _ \\ | |/ _ \\  | |    | |      | |  
 / ____ \\| | | | (_| | |_| | | (_| | |     / ____ \\| ||  __/ | | (_) | | |____| |____ _| |_ 
/_/    \\_\\_| |_|\\__, |\\__,_|_|\\__,_|_|    /_/    \\_\\_| \\___|_|_|\\___/   \\_____|______|_____|
                 __/ |                                                                      
                |___/                                                                       
             
Angular Afelio CLI: ${packageJson.version}

  `);

program.option('-v, --version-full', 'output the version number of ng-afelio and ng');

program
  .command('new <name>')
  .alias('n')
  .description('Generate new Angular project')
  .option('--skip-ui-kit', 'Does not create the ui-kit project')
  .action((name, options) => {
    createNewProject(name, options.skipUiKit || false).then(() => {
      console.info(`Please go to new directory "cd ./${name}"`);
    });
  });

program
  .command('uiServe')
  .alias('us')
  .description('Start UI Kit serve')
  .option('-p, --port <port>', 'Change default port', 5200)
  .action((options) => {
    serveUIKit(options.port);
  });

program
  .command('serve')
  .alias('ms')
  .description('Start dev server')
  .option('-e, --env <environment>', 'Change default environment')
  .option('-p, --port <port>', 'Change default port', 4200)
  .action((options) => {
    serveMain(options.env, options.port);
  });

program
  .command('start')
  .alias('s')
  .description('Start all dev tools')
  .option('-e, --env <environment>', 'Change default environment')
  .option('-p, --port <port>', 'Change default port', 4200)
  .option('-u, --ui-port <uiPort>', 'Change default port of ui-kit', 5200)
  .action((options) => {
    Promise.all([serveMain(options.env, options.port), serveUIKit(options.ui-port)]);
  });

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generates and/or modifies files based on a schematic')
  .option('-r, --ngrx', 'NGRX / Redux')
  .option('-l, --light', 'Only generate components, services and models folder')
  .action((type, name, options) => {
    generate(type, name, options.ngrx || false, options.light || false);
  });

program
  .command('build')
  .alias('b')
  .description('Builds your app and places it into the dist folder')
  .option('-u, --ssr', 'Server Side Rendering / Universal')
  .option('-e, --env <environment>', 'Change default environment', 'production')
  .option('--base-href <href>', 'Base url for the application being built')
  .action((options) => {
    build(options.env, options.ssr || false, options.baseHref);
  });

program
  .command('style')
  .description('Build style from UI Kit')
  .action(() => {
    buildStyle();
  });

program
  .command('mocks')
  .description('Generate mocks system')
  .action(() => {
    generateMocks();
  });

program
  .command('api <source>')
  .description('Generates swagger api and models using json or yaml source')
  .option('-n, --name <name>', 'Name of api module', 'api')
  .option('-k, --api-key <apiKey>', 'Key of json or yaml source')
  .option('-x, --extract', 'Extract swagger file to assets. Already done if you use --api-key')
  .option('-r, --regenerate', 'Add this flag to use regenerate mode')
  .option('-s, --api-version <apiVersion>', 'Swagger version (available: 2 or 3)')
  .action((source, options) => {
    if (options.regenerate) {
      regenerateApi(source);
    } else {
      if (!options.apiVersion) {
        console.info(`${colors.blue('No api version given.')} Will use 2.`);
        options.apiVersion = 2;
      }
      generateApi(source, options.name, options.apiKey, options.extract, options.apiVersion);
    }
  });

program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  program.outputHelp(((text) => `Here is how to use this CLI:\n${text}`));
  process.exit(1);
});

program
  .version(version)
  .description(version);
  
program.parse(process.argv);

if (program.versionFull) {
  console.info(version);
  getAngularVersion();
}

if (!process.argv.slice(2).length) {
  program.outputHelp(((text) => `Here is how to use this CLI:\n${text}`));
}
