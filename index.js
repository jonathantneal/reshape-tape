#!/usr/bin/env node

// tooling
const fs      = require('fs');
const log     = require('./lib/log');
const path    = require('path');
const reshape = require('reshape')();

// current directory
const cwd = process.cwd();

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
	// package.json.reshapeConfig options
	requireOrThrow(path.join(cwd, 'package.json')).reshapeConfig,
	// argument options
	...process.argv.filter(
		arg => optionMatch.test(arg)
	).map(
		arg => arg.match(optionMatch)
	).map(
		arg => ({
			[arg[1]]: arg[3]
		})
	)
);

// plugin
const defaultPlugin = requireOrThrow(path.resolve(cwd, opts.plugin));

// tests
const tests = requireOrThrow(path.resolve(cwd, opts.config));

// runner
Object.keys(tests).reduce(
	(resolved, section) => resolved.then(
		() => Object.keys(tests[section]).reduce(
			(resolved2, name) => resolved2.then(
				passing => {
					const test = tests[section][name];

					log.wait(section, test.message);

					const plugin = typeof test.plugin === 'function' ? test.plugin : defaultPlugin;
					const prepped = 'options' in test ? plugin(test.options) : plugin();
					const coreName = name.split(':')[0];
					const baseName = name.split(':').join('.');

					// test paths
					const sourcePath = path.resolve(opts.fixtures, test.source || `${coreName}.html`);
					const expectPath = path.resolve(opts.fixtures, test.expect || `${baseName}.expect.html`);
					const resultPath = path.resolve(opts.fixtures, test.result || `${baseName}.result.html`);

					if (typeof test.before === 'function') {
						test.before();
					}

					return readFile(sourcePath, 'utf8').then(
						html => reshape.process(html, {
							filename: sourcePath,
							plugins: [prepped]
						})
						.then(result => result.output())
						.then(
							resultHTML => writeFile(resultPath, resultHTML).then(
								() => readFile(expectPath, 'utf8').catch(
									() => writeFile(expectPath, '').then(
										() => ''
									)
								)
							).then(
								expectHTML => {
									if (expectHTML !== resultHTML) {
										return Promise.reject([
											`Expected: ${expectHTML}`,
											`Rendered: ${resultHTML}`
										])
									}

									return passing;
								}
							)
						)
					).catch(
						error => {
							const expectedError = test.error && Object.keys(test.error).every(
								key => test.error[key] instanceof RegExp ? test.error[key].test(error[key]) : test.error[key] === error[key]
							);

							if (expectedError) {
								log.pass(section, test.message);

								return passing;
							}

							log.fail(section, test.message, error.reason || error.message || error);

							return false;
						}
					).then(
						isTrue => {
							if (typeof test.after === 'function') {
								test.after();
							}

							if (isTrue) {
								log.pass(section, test.message);
							} else {
								log.fail(section, test.message);
							}

							return isTrue;
						}
					);
				}
			),
			Promise.resolve(true)
		)
	),
	Promise.resolve()
).then(
	passing => passing === false ? process.exit(1) : process.exit(0),
	() => process.exit(1)
);

// load modules or throw an error
function requireOrThrow(name) {
	try {
		return require(name);
	} catch (error) {
		log.fail('reshape-tape', `${name} failed to load`);

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
