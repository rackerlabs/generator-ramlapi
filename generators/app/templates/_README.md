# <%= projectTitle %> RAML API Project

<%= projectDescription %>

## Working with the RAML API project

This project uses conventions to support files that are added without needing to modify the gulpfile.js that runs the validation and document production.

## Usage

```bash
gulp
```

Validates the JSON Schema, RAML, and produces documentation in the `public/` directory.

### Project Structure

* *`*.raml`*: Any RAML files in the root directory are considered primary API documents.
* *`raml/`*: RAML fragment files referenced by the primary RAML.
* *`schema/`*: JSON Schema files referenced in RAML files (or fragments).
* *`examples/`*: JSON example files for the JSON Schema.
* *`public/`*: a folder suitable to publish to a GitHub project page with generated documentation.
* *`templates/`*: contains the RAML2HTML templates that are used instead of the default templates.

### RAML Notes

RAML files should not include JSON Schema directly, but should instead use `!include` to include them from the `schema/` directory.

[raml2html](https://github.com/kevinrenskers/raml2html) is used to generate the documentation HTML. Since it currently doesn't support references in the JSON Schema, this project does the following:

### Schema Notes

Schema files are expected to be stored in the `schema/` directory (this can be changed in the `gulpfile.js`.

Example files are stored in the `examples/` directory.

Example files that are included in a RAML media type section with a schema are validated against that schema.
