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

const uiKitTypes = require('./models/ui-kit-types.enum');

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
  .option('--ui-kit <uiKit>', 'Ui-kit type (' + Object.values(uiKitTypes).slice(1).join(', ') + ').', uiKitTypes.DEFAULT)
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--commit=false --directory=."')
  .action((name, options) => {
    createNewProject(name, options.uiKit || false, options.ng).then(() => {
      console.info(`Please go to new directory "cd ./${name}"`);
    });
  });

program
  .command('uiServe')
  .alias('us')
  .description('Start UI Kit serve')
  .option('-p, --port <port>', 'Change default port', 5200)
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--open --baseHref=/folder/"')
  .action((options) => {
    serveUIKit(options.port, options.ng);
  });

program
  .command('serve')
  .alias('ms')
  .description('Start dev server')
  .option('-e, --env <environment>', 'Change default environment')
  .option('-p, --port <port>', 'Change default port', 4200)
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--open --baseHref=/folder/"')
  .action((options) => {
    serveMain(options.env, options.port, options.ng);
  });

program
  .command('start')
  .alias('s')
  .description('Start all dev tools')
  .option('-e, --env <environment>', 'Change default environment')
  .option('-p, --port <port>', 'Change default port', 4200)
  .option('-u, --ui-port <uiPort>', 'Change default port of ui-kit', 5200)
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--open --baseHref=/folder/"')
  .action((options) => {
    Promise.all([serveMain(options.env, options.port, options.ng), serveUIKit(options.uiPort, options.ng)]);
  });

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generates and/or modifies files based on a schematic')
  .option('-r, --ngrx', 'NGRX / Redux')
  .option('-l, --light', 'Only generate components, services and models folder')
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--dryRun=true"')
  .action((type, name, options) => {
    generate(type, name, options.ngrx || false, options.light || false, options.ng);
  });

program
  .command('build')
  .alias('b')
  .description('Builds your app and places it into the dist folder')
  // .option('-u, --ssr', 'Server Side Rendering / Universal')
  .option('-e, --env <environment>', 'Change default environment', 'production')
  .option('--base-href <href>', 'Base url for the application being built')
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--namedChunks=false --extractLicenses=true"')
  .action((options) => {
    build(options.env, options.ssr || false, options.baseHref, options.ng);
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
  .option('-p, --proxy <proxy>', 'Proxy url to get swagger file')
  .action((source, options) => {
    if (options.regenerate) {
      regenerateApi(source);
    } else {
      if (!options.apiVersion) {
        console.info(`${colors.blue('No api version given.')} Will use 2.`);
        options.apiVersion = 2;
      }
      generateApi(source, options.name, options.apiKey, options.extract, options.apiVersion, options.proxy);
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
