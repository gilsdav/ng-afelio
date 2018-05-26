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
  build
} = require('./logic');

program
  .command('new <name>')
  .alias('n')
  .description('Generate new Angular project')
  .action((name) => {
    createNewProject(name).then(() => {
      console.info(`Please go to new directory "cd ./${name}"`);
    });
  });

program
  .command('uiServe')
  .alias('us')
  .description('Start UI Kit serve')
  .action(() => {
    serveUIKit();
  });

program
  .command('serve')
  .alias('ms')
  .description('Start dev server')
  .action(() => {
    serveMain();
  });

program
  .command('start')
  .alias('s')
  .description('Start all dev tools')
  .action(() => {
    Promise.all([serveMain(), serveUIKit()]);
  });

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generates and/or modifies files based on a schematic')
  .action((type, name) => {
    generate(type, name);
  });

program
  .command('build')
  .option('-u, --ssr', 'Server Side Rendering / Universal')
  .option('-e, --env <environment>', 'Change default environment', 'production')
  .option('-h, --base-href <href>', 'Base url for the application being built')
  .alias('b')
  .description('Builds your app and places it into the dist folder')
  .action((options) => {
    build(options.env, options.ssr || false, options.baseHref);
  });

getAngularVersion().then(version => {
    program
    .version(colors.cyan(`
                              _                        __     _ _          _____ _      _____ 
      /\\                     | |                /\\    / _|   | (_)        / ____| |    |_   _|
     /  \\   _ __   __ _ _   _| | __ _ _ __     /  \\  | |_ ___| |_  ___   | |    | |      | |  
    / /\\ \\ | '_ \\ / _  | | | | |/ _  | '__|   / /\\ \\ |  _/ _ \\ | |/ _ \\  | |    | |      | |  
   / ____ \\| | | | (_| | |_| | | (_| | |     / ____ \\| ||  __/ | | (_) | | |____| |____ _| |_ 
  /_/    \\_\\_| |_|\\__, |\\__,_|_|\\__,_|_|    /_/    \\_\\_| \\___|_|_|\\___/   \\_____|______|_____|
                   __/ |                                                                      
                  |___/                                                                       
               
  Angular Afelio CLI: ${packageJson.version}

    `))
    .description('Angular Afelio CLI');
    
    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
      program.outputHelp(((text) => `Here is how to use this CLI:\n${text}`));
    }

});
