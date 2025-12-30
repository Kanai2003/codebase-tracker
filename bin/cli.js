#!/usr/bin/env node

const { program } = require('commander');
const { scanCodebase } = require('../lib/tracker');
const { generateReport } = require('../lib/report');
const path = require('path');
const packageJson = require('../package.json');

program
  .name(packageJson.name)
  .description(packageJson.description + '\n\nThis tool tracks component and function usage in your codebase, respecting your .gitignore file.')
  .version(packageJson.version)
  .option('-d, --directory <dir>', 'The directory to scan', './')
  .option('-o, --output <file>', 'The file to save the report', 'component-function-usage-report.txt')
  .action((options) => {
    const directory = path.resolve(process.cwd(), options.directory);
    const output = path.resolve(process.cwd(), options.output);
    const packageName = packageJson.name;

    console.log(`Scanning directory: ${directory}`);
    const usageData = scanCodebase(directory);
    generateReport(usageData, output, packageName, directory);
    console.log(`Report generated at: ${output}`);
  });

program.parse(process.argv);
