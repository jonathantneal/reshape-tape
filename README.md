# Reshape Tape [<img src="https://jonathantneal.github.io/reshape-boilerplate/logo.svg" alt="Reshape" width="90" height="90" align="right">][Reshape]

[![NPM Version][npm-img]][npm-url]
[![Build Status][cli-img]][cli-url]
[![Licensing][lic-img]][lic-url]
[![Changelog][log-img]][log-url]
[![Gitter Chat][git-img]][git-url]

[Reshape Tape] lets you quickly test [Reshape] plugins.

1. Install this dependency to your project:

   ```sh
   npm install --save-dev reshape-tape
   ```

2. Add the `reshape-tape` task to your `package.json`:

   ```json
   {
      "scripts": {
        "tape": "reshape-tape"
      }
   }
   ```

3. Add tests to your `.tape.js` file:

   ```js
   module.exports = {
		'reshape-my-plugin': {
			'basic': {
				message: 'supports basic usage'
			}
		}
   };
   ```

That’s it! Now you can use the `tape` task:

```sh
npm run tape
```

## Options

Options may be passed through `package.json` using `reshapeConfig`:

```json
{
	"reshapeConfig": {
		"plugin": "path/to/plugin.js",
		"config": "path/to/.tape.js",
		"fixtures": "path/to/htmldir"
	}
}
```

Options may be passed through arguments:

```sh
reshape-tape --plugin=path/to/plugin.js --config=path/to/.tape.js
```

[npm-url]: https://www.npmjs.com/package/reshape-tape
[npm-img]: https://img.shields.io/npm/v/reshape-tape.svg
[cli-url]: https://travis-ci.org/jonathantneal/reshape-tape
[cli-img]: https://img.shields.io/travis/jonathantneal/reshape-tape.svg
[lic-url]: LICENSE.md
[lic-img]: https://img.shields.io/npm/l/reshape-tape.svg
[log-url]: CHANGELOG.md
[log-img]: https://img.shields.io/badge/changelog-md-blue.svg
[git-url]: https://gitter.im/reshape/reshape
[git-img]: https://img.shields.io/badge/chat-gitter-blue.svg

[Reshape Tape]: https://github.com/jonathantneal/reshape-tape
[Reshape]: https://github.com/reshape/reshape
