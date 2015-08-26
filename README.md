# generator-ramlapi

`generator-ramlapi` is a generator for [Yeoman](http://yeoman.io) that generates a project scaffold for API development in RAML and JSON Schema.

*Features*

* RAML validation
* RAML HTML document generation (via RAML2HTML) with improved HTML templates
* JSON Schema validation
* Example validation against JSON Schema

See also: 

* [Generator-RAMLAPI Home Page](http://www.markmorga.com/generator-ramlapi)
* [API Docs](http://www.markmorga.com/generator-ramlapi/generator-ramlapi/0.2.4/index)

[![NPM](https://nodei.co/npm/generator-ramlapi.png)](https://npmjs.org/package/generator-ramlapi)

[![Build Status](https://travis-ci.org/mmorga/generator-ramlapi.svg?branch=master)](https://travis-ci.org/mmorga/generator-ramlapi)
[![Dependency Status](https://david-dm.org/mmorga/generator-ramlapi.svg)](https://david-dm.org/mmorga/generator-ramlapi)
[![Codacy Badge](http://api.codacy.com:80/project/badge/0f44e2c1d52e418fb9a36cc9dacfef21)](https://www.codacy.com/app/markmorga/generator-ramlapi)


## Getting Started:

*Installing Dependencies*

Install [NodeJS](https://nodejs.org/download/). On OSX, installation via [NVM](https://www.npmjs.com/package/nvm) and/or [Homebrew](brew.sh) is highly recommended.

Update [NPM](https://www.npmjs.com). Depending on your installation, you may need to use `sudo` for the following commands.

```bash
npm install -g npm
```

Install Yeoman, [Gulp](gulpjs.com) and generator-ramlapi:

```bash
npm install -g yo gulp generator-ramlapi
```

## Beginning a project

Create a directory for your RAML API project and `cd` into it.

Run the generator like this:

```bash
yo ramlapi
```

The generator will ask you a number of questions. Answer these as completely as you can, but all can be changed later if need be.

After the questions, the generator will install the NPM dependencies for your project.

## Usage

To run the validation and build HTML docs, simply run the command:

```bash
gulp
```

Validates the JSON Schema, RAML, and produces documentation in the `public/` directory.

### Project Structure

* *`*.raml`*: files located in the root directory are documented.
* *`raml/`*: RAML fragment files referenced by the primary RAML.
* *`schema/`*: JSON Schema files referenced in RAML files (or fragments).
* *`examples/`*: JSON example files for the JSON Schema.
* *`public/`*: a folder suitable to publish to a GitHub project page with generated documentation.
* *`templates/`*: contains the RAML2HTML templates that are used instead of the default templates.

### RAML Notes

RAML files should not include JSON Schema directly, but should instead use `!include` to include them from the `schema/` directory. This isn't essential - just a best practice.

[raml2html](https://github.com/kevinrenskers/raml2html) is used to generate the documentation HTML.

### Schema Notes

Schema files are expected to be stored in the `schema/` directory.

Example files are stored in the `examples/` directory.

Example files that are included in a RAML media type section with a schema are validated against that schema.

## Generator improvements to come

1. scaffold the github page
2. gulp-watch support

## License

Apache-2.0
