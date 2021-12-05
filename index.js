#!/usr/bin/env node

const { Command } = require('commander');
const colors = require('colors');
const packageJson = require('./package.json');

const { schematics } = require('./collection.json');

const { 
  createNewProject,
  // getAngularVersion,
  serveUIKit,
  serveMain,
  generate,
  build,
  buildStyle,
  // generateMocks,
  generateApi,
  regenerateApi,
  checkFiles,
  generateModelsFromGeneratedApi
} = require('./logic');

const { getAllArgs } = require('./remainer-args');

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

const program = new Command();

program
  .version(version)
  .description(version);

// program.option('-v, --version-full', 'output the version number of ng-afelio and ng');

program
  .command('new <name>')
  .alias('n')
  .description('Generate new Angular project')
  .option('--ui-kit <uiKit>', 'Ui-kit type (' + Object.values(uiKitTypes).slice(1).join(', ') + ').', uiKitTypes.DEFAULT)
  .option('--ng <ng>', 'Standard Angular CLI options (Only use not available options in ng-afelio) Example: --ng="--commit=false --directory=."')
  .action((name, options) => {
    createNewProject(name, options.uiKit || false, options.ng).then(() => {
      console.info(`Please go to new directory "cd ./${name}"`);
      process.exit();
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

const generateCommand = program.command('generate [type] [name]')
generateCommand
  .alias('g')
  .description(`Generates and/or modifies files based on angular schematics`, {
    type: `One type from this list:\n    ${colors.cyan(Object.keys(schematics).filter(name => !name.startsWith('install-') && !name.startsWith('ng-')).join('\n    '))}`,
    name: 'Name of element to generate.'
  })
  .option('-h, --help', 'output help message')
  .allowUnknownOption()
  // .parse(process.argv)
  .action((type, name, options, command) => {
    if (type) {
      generate(type, name, getAllArgs(command, options.help)).then(() => {
        process.exit();
      });
    } else {
      return generateCommand.outputHelp();
    }
  })

const installCommand = program.command('install [type]');
installCommand
  .alias('i')
  .description(`Add libs from ng-afelio schematics`, {
    type: `One type from this list:\n    ${colors.cyan(Object.keys(schematics).filter(name => name.startsWith('install-')).map(name => name.replace('install-', '')).join('\n    '))}`
  })
  .option('-h, --help', 'output help message')
  .allowUnknownOption()
  // .parse(process.argv)
  .action((type, options, command) => {
    if (type) {
      generate(`install-${type}`, undefined, getAllArgs(command, options.help)).then(() => {
        process.exit();
      });
    } else {
      return installCommand.outputHelp();
    }
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
    build(options.env, options.ssr || false, options.baseHref, options.ng).then(() => {
      process.exit();
    });
  });

program
  .command('style')
  .description('Build style from UI Kit')
  .action(() => {
    buildStyle().then(() => {
      process.exit();
    });
  });

program
  .command('mocks')
  .description('Generate mocks system')
  .action(() => {
    generate('install-mocks').then(() => {
      process.exit();
    });
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
      regenerateApi(source).then(() => {
        process.exit();
      });
    } else {
      if (!options.apiVersion) {
        console.info(`${colors.blue('No api version given.')} Will use 2.`);
        options.apiVersion = 2;
      }
      generateApi(source, options.name, options.apiKey, options.extract, options.apiVersion, options.proxy).then(() => {
        process.exit();
      });
    }
  });

program
  .command('check <type>')
  .description('Check alignement between files (type: environment or i18n)')
  .option('-m, --mainFile <mainFile>', 'Automaticaly align all files with the main.')
  .action((type, options) => {
    if (type === 'environment' || type === 'i18n') {
      checkFiles(type, options.mainFile).then(() => {
        process.exit();
      });
    } else {
      console.error(`${colors.red(`Type "${type}" does not exist.`)}`);
    }
  });


  program
  .command('generate-models')
  .description('Generate the models based upon the generated interfaces inside the specified folder')
  .option('-f, --folder <folder>', 'The folder which holds the generated interfaces')
  .option('-o, --output <output>', 'The folder which will hold the generated models')
  .option('-a, --api <apiName>', 'The api name used in the imports')
  .action((options) => {
      generateModelsFromGeneratedApi(options.folder, options.output, options.api).then(() => {
        process.exit();
      });
  });

program.on('command:*', () => {
  console.error(colors.red('Invalid command: %s') + '\nSee --help for a list of available commands.', program.args.join(' '));
  program.outputHelp(((text) => `Here is how to use this CLI:\n\n${text}`));
  process.exit(1);
});
  
program.parse(process.argv);

// const options = program.opts();

// if (options.versionFull) {
//   console.info(version);
//   getAngularVersion().then(() => {
//     process.exit();
//   });
// }

// if (!process.argv.slice(2).length) {
//   program.outputHelp(((text) => `Here is how to use this CLI:\n${text}`));
// }
