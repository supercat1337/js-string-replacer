#!/usr/bin/env node

// @ts-check

/**
 * @file CLI entry point.
 */

import fs from 'fs/promises';
import path from 'path';
import minimist from 'minimist';
import { loadConfig, getDefaultConfig } from './config.js';
import { transformCode } from './transform.js';

/**
 * Print help message to console.
 */
function printHelp() {
  console.log(`
Usage: js-string-replacer [options] <input-file> <output-file>

Options:
  -c, --config <file>   Path to INI configuration file.
  -h, --help            Show this help message.

Configuration file (INI format):
  pattern = <regex pattern>   # default: </script>
  flags = <regex flags>       # default: gi
  separator = <separator>     # default: _separator_
`);
}

/**
 * Main function.
 */
async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['config'],
    alias: { c: 'config', h: 'help' },
    boolean: ['help'],
  });

  if (argv.help) {
    printHelp();
    process.exit(0);
  }

  // Get positional arguments
  const args = argv._;
  if (args.length < 2) {
    console.error('Error: Missing input or output file.');
    printHelp();
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  // Load configuration
  let config;
  if (argv.config) {
    try {
      config = await loadConfig(argv.config);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  } else {
    config = getDefaultConfig();
    console.log('Using default configuration.');
  }

  // Read input file
  let code;
  try {
    code = await fs.readFile(inputFile, 'utf8');
  } catch (err) {
    console.error(`Failed to read input file: ${err.message}`);
    process.exit(1);
  }

  // Transform
  let transformed;
  try {
    transformed = transformCode(code, config);
  } catch (err) {
    console.error(`Transformation failed: ${err.message}`);
    process.exit(1);
  }

  // Write output
  try {
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, transformed, 'utf8');
    console.log(`Successfully written to ${outputFile}`);
  } catch (err) {
    console.error(`Failed to write output file: ${err.message}`);
    process.exit(1);
  }
}

// Run main
main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});