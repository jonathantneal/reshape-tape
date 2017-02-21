#!/usr/bin/env node

// tooling
const fs      = require('fs');
const path    = require('path');
const reshape = require('reshape');

// current directory
const cwd = process.cwd();

// error symbols
const pass = '\x1b[32m\✔\x1b[0m';
const fail = '\x1b[31m\✖\x1b[0m';

// argument option matcher
const optionMatch = /^--([\w-]+)=(["']?)(.+?)\2$/;

// options
const opts = Object.assign(
	// default options
	{
		plugin:   cwd,
		config:   path.join(cwd, '.tape.js'),
		fixtures: path.join(cwd, 'test')
	},
	// package.json[reshapeConfig] options
	requireOrThrow(path.join(cwd, 'package.json')).reshapeConfig,
	// argument options
	...process.argv.filter(
		(arg) => optionMatch.test(arg)
	).map(
		(arg) => arg.match(optionMatch)
	).map(
		(arg) => ({
			[arg[1]]: arg[3]
		})
	)
);

// plugin
const plugin = requireOrThrow(path.resolve(cwd, opts.plugin));

// tests
const tests = requireOrThrow(path.resolve(cwd, opts.config));

// runner
Promise.all(Object.keys(tests).map(
	(section) => Promise.all(
		Object.keys(tests[section]).map(
			(name) => {
				// test options
				const test = tests[section][name];

				const baseName = name.split(':')[0];
				const testName = name.split(':').join('.');

				// test paths
				const sourcePath = path.resolve(opts.fixtures, baseName + '.html');
				const expectPath = path.resolve(opts.fixtures, testName + '.expect.html');
				const resultPath = path.resolve(opts.fixtures, testName + '.result.html');

				// promise source html and expected html contents
				return Promise.all([
					readFile(sourcePath, 'utf8'),
					readFile(expectPath, 'utf8')
				]).then(
					([sourceHTML, expectHTML]) => reshape(
						Object.assign(
							{},
							test.process,
							{
								plugins: [
									plugin(test.options)
								]
							}
						)
					).process(sourceHTML).then(
						(result) => writeFile(resultPath, result.output()).then(
							() => {
								if (result.output() !== expectHTML) {
									throw new Error(`  ${ fail }  ${ test.message }\n${ JSON.stringify({
										expect: expectHTML,
										result: result.output()
									}, null, '  ') }`);
								} else {
									return `  ${ pass }  ${ test.message }`;
								}
							}
						),
						(error) => {
							const expectedError = test.error && Object.keys(test.error).every(
								(key) => test.error[key] instanceof RegExp ? test.error[key].test(error[key]) : test.error[key] === error[key]
							);

							if (expectedError) {
								return `  ${ pass }  ${ test.message }`;
							} else {
								if (test.after) {
									test.after();
								}

								throw error;
							}
						}
					)
				).then(
					(result) => {
						if (test.after) {
							test.after();
						}

						return result;
					}
				);
			}
		)
	).then(
		(messages) => console.log(`${ pass } ${ section }\n${ messages.join('\n') }\n`),
		(error) => {
			console.log(`${ fail } ${ section }\n${ error }\n`);

			throw error;
		}
	)
)).then(
	() => console.log(`\n${ pass } Test passed\n`) && process.exit(0),
	() => console.log(`\n${ fail } Test failed\n`) && process.exit(1)
);

// load modules or throw an error
function requireOrThrow(name) {
	try {
		return require(name);
	} catch (error) {
		console.log(`${ fail } Failed to load "${ name }"\n`);

		return process.exit(1);
	}
}

// Promise fs.readFile
function readFile(filename) {
	return new Promise(
		(resolve, reject) => fs.readFile(filename, 'utf8',
			(error, data) => error ? reject(error) : resolve(data)
		)
	);
}

// Promise fs.writeFile
function writeFile(filename, data) {
	return new Promise(
		(resolve, reject) => fs.writeFile(filename, data,
			(error) => error ? reject(error) : resolve()
		)
	);
}
