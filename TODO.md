# TODO

Here's what this project should do for you...

## Project installation

* There should be a gulp task to specify/update additional git projects for schema, raml fragments, etc.

## Working on a project
Once a project is established...

* [x] Parse RAML file and check for errors (~~raml-parser~~, ~~raml-cop~~, ramllint)
* [X] Validate examples and schema with jsonlint
* [X] Find the examples with schema references for a raml file and validate with tv4.
    - [X] Point out examples with no schema and vice versa
    - [ ] Point out examples/schema/raml fragments not referenced in main RAML
    - [X] Point out bodies without examples or schema (ramllint does this)
* [X] Pre-process RAML for raml2html
    - [X] prep json schema for documentation (2 or 3 options)
        + ~~+ 1. Use json-schema-deref to compose the json schema and replace the !include references with the full json schema.~~
        + ~~+ 2. Come up with javascript script that can properly de-reference json schemas and present them correctly in the browser~~
        + ~~+ 3. Add links to individual parts of schema files and examples.Add this to the raml2html templates~~
* ~~[ ] Re-validate pre-processed RAML and json schema~~
* [X] Process the RAML into HTML docs (include schemas, examples, etc.)
* [ ] Publish to github pages
* [ ] Add js docs to source
* [ ] Add custom rules to ramllint
* [ ] Pull set of dependencies in the yeoman script from the generator's package.json devDependencies
* [ ] Formatting JSON and schema to match style

Values:

* No magic: the auto insertion of the config was easy, but hard to debug
* Limit the number of conventions:
    - [X] Eliminate the '-full' json schema convention
    - [X] Use the example/schema relationship in the RAML instead of requiring matching names
    - [X] provide a way to specify a main RAML file (instead of forcing a name) - formats all RAML files in top level directory as a main raml files
