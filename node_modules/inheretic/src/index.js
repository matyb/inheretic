#!/usr/bin/env node
const fs = require('fs');
const program = require('caporal');

const debugWriter = (fileName, contents) => {
    console.log(`DEBUG: not writing what follows to "${fileName}":\n`, contents);
};
const main = (args, options, logger) => {
  const io = options.reportOnly ? debugWriter : fs.writeFileSync;
  require('./inherit')(args.dir, io, args.templateName);
};

program
  .version('0.0.1')
  .command('inherit', 'Write package.json files for package.json/template files discovered within the provided directory.')
  .argument('<dir>', 'Directory to create/update package.json files with parents.')
  .argument('[template-name]', 'Name of package.json template files.', /.*$/, 'package.json')
  .option('--report-only', 'Do not write package.json files - instead print them to stdout.')
  .action(main);
program.parse(process.argv);

module.exports = main;