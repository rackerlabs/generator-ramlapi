'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash/string');
var glob = require('glob');
var async = require('async');
var ramlParser = require('raml-parser');
var strutils = require('./templates/lib/strutils');
var strutil = new strutils.strutils();

// Configuration Options and defaults
// name                   | existing project default   | new project default
// =======================|============================|=====================
// projectTitle           | raml:title                 | titleize({this.appname})
// projectName            | (kebabCase of title)       | kebabCase({this.appname})
// projectDescription     | raml:documentation.content | {projectTitle} RAML API description and Schema validations.
// baseUri                | raml:baseUri               | https://{projectName}.example.com/{version}
// version                | raml.version               | v1
// ramlFile               | raml file                  | {projectName}-{version}

function titleize(s) {
  return strutil.titleize(s);
}

function _input(name, message, defs, defaultVal, opts) {
  var prompt = {
    name: name,
    message: message,
    store: true
  };
  opts = opts || {};

  if (defs[name] || defaultVal) {
    prompt.default = defs[name] || defaultVal;
  }

  Object.keys(opts).forEach(function (k) {
    prompt[k] = opts[k];
  });

  return prompt;
}

/**
 * Looks for the RAML file in the root of the project
 * @arg {Object} defs container for defaults
 * @arg callback to call when complete
 */
function scanForRamlFile(defs, callback) {
  glob('*.raml', function (err, files) {
    if (err) {
      this.log('Error in scanForRamlFile:');
      this.log(err);
      callback(null, defs);
    }

    defs.ramlFiles = files;
    if (files.length === 1) {
      defs.ramlFile = files[0];
    }
    // TODO: set projectName and version from parsed raml file name

    callback(null, defs);
  });
}

function readRamlFile(defs, callback) {
  if (defs.ramlFile) {
    ramlParser.loadFile(defs.ramlFile).then(function (raml) {
      if (raml.title) {
        defs.projectTitle = raml.title;
        defs.projectName = _.kebabCase(raml.title);
      }
      if (raml.documentation) {
        if (raml.documentation.length > 0) {
          if (raml.documentation[0].content) {
            defs.projectDescription = raml.documentation[0].content;
          }
        }
      }
      if (raml.baseUri) {
        defs.baseUri = raml.baseUri;
      }
      if (raml.version) {
        defs.apiVersion = raml.version;
      }
      callback(null, defs);
    }, function (error) {
      callback(error, defs);
    });
  } else {
    callback(null, defs);
  }
}

module.exports = yeoman.generators.Base.extend({

  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);
    this._pkg = {};
  },

  _defs: function (callback) {
    var defs = {},
      processDefs = async.seq(
        scanForRamlFile,
        readRamlFile);

    processDefs(defs, function (err, results) {
      if (err) {
        this.log(err);
        callback(err, results);
      }
      this._defaults = results;
      callback(null, results);
    });
  },

  _getPrompts: function (defs) {
    return [
      _input('projectTitle', 'What is the title of your API? (example: "Widget Warehouse")',
        defs, strutil.normalizeTitle(defs.projectTitle) || titleize(this.appname)),
      _input('projectName', 'What is the name of your API? (example: "widget-warehouse")',
        defs, defs.projectName || _.kebabCase(this.appname), {
          validate: function (input) {
            if (input.match(/\w+(\-\w+)*/)) {
              return true;
            }
            return 'Project name must contain only lowercase letters and dash.';
          }
        }),
      _input('projectDescription', 'Describe the API.',
        defs, null, {
          default: function (answers) {
            return defs.projectDescription || answers.projectTitle + ' RAML API description and Schema validations.';
          }
        }),
      _input('version', 'What version do you want to use?',
        defs, strutil.normalizeVersion(defs.version) || 'v1', {
          validate: function (input) {
            if (input.match(/v?(\d+(\.\d+){0,2})/)) {
              return true;
            }
            return 'Versions are of the form: v1, 1, 2.1, v2.1, 3.3.3';
          }
        }),
      _input('baseUri', 'What is the API\'s baseUri?',
        defs, null, {
          default: function (answers) {
            strutil.normalizeUri(defs.baseUri);
            return defs.baseUri || 'https://' + answers.projectName + '.example.com';
          }
        })];
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('RAML API Project') + ' generator!'
    ));

    this._defs(function (err, defs) {
      if (err) {
        this.log(err);
        done();
      }

      this.prompt(this._getPrompts(defs), function (props) {
        this.props = props;
        this.props.mainRamlFile = defs.ramlFile;

        // To access props later use this.props.someOption;

        done();
      }.bind(this));
    }.bind(this));
  },

  configuring: function () {
    this.props.mainRamlFile = this.props.mainRamlFile || this.props.projectName + '-' + this.props.version + '.raml';
    this.config.save();
  },

  _writePackageJson: function () {
    if (!this._pkg.hasOwnProperty('name')) {
      this._pkg.name = this.props.projectName;
    }
    if (!this._pkg.hasOwnProperty('description')) {
      this._pkg.description = this.props.projectDescription;
    }
    if (!this._pkg.hasOwnProperty('version')) {
      var re = new RegExp(/v?(\d+)(\.\d+)?(\.\d+)?/);
      var match = re.exec(this.props.version);
      if (!match) {
        this._pkg.version = '1.0.0';
      } else {
        this._pkg.version = [match[1], match[2] || '.0', match[3] || '.0'].join('');
      }
    }
    if (!this._pkg.hasOwnProperty('private')) {
      this._pkg.private = this.props.true;
    }
    this._pkg.dependencies = this._pkg.dependencies || {};
    this._pkg.dependencies.async = '^1.4.0';
    this._pkg.dependencies.gulp = '^3.9.0';
    this._pkg.dependencies['gulp-debug'] = '^2.0.1';
    this._pkg.dependencies['gulp-filter'] = '^3.0.0';
    this._pkg.dependencies['gulp-jsonlint'] = '^1.1.0';
    this._pkg.dependencies['gulp-plumber'] = '^1.0.1';
    this._pkg.dependencies['gulp-rename'] = '^1.2.2';
    this._pkg.dependencies['gulp-util'] = '^3.0.6';
    this._pkg.dependencies['gulp-watch'] = '^4.3.4';
    this._pkg.dependencies['js-yaml'] = '^3.3.1';
    this._pkg.dependencies['json-schema-ref-parser'] = '^1.0.0-alpha.10';
    this._pkg.dependencies['map-stream'] = '0.0.6';
    this._pkg.dependencies['raml-parser'] = '^0.8.11';
    this._pkg.dependencies.raml2html = '^2.0.2';
    this._pkg.dependencies.ramllint = 'https://github.com/mmorga/ramllint.git#a4f8eac52a5be139a4801e4df5fd9929decb89dd';
    this._pkg.dependencies.through2 = '^2.0.0';
    this._pkg.dependencies.traverse = '^0.6.6';
    this._pkg.dependencies.tv4 = '^1.1.9';
    this.fs.writeJSON(this.destinationPath('package.json'), this._pkg);
  },

  writing: function () {
    this._writePackageJson();
    ['_.gitignore', '_.editorconfig', '_README.md', '_gulpfile.js'].forEach(function (tplPath) {
      this.fs.copyTpl(
        this.templatePath(tplPath),
        this.destinationPath(tplPath.substr(1)),
        this.props
      );
    }, this);

    if (glob.sync('*.raml').length === 0) {
      this.fs.copyTpl(
        this.templatePath('_project.raml'),
        this.destinationPath(this.props.mainRamlFile),
        this.props
      );

      if (glob.sync('schema/*.json').length === 0) {
        this.fs.copy(
          this.templatePath('schema/*'),
          this.destinationPath('schema/')
        );
      }

      if (glob.sync('examples/*.json').length === 0) {
        this.fs.copy(
          this.templatePath('examples/*'),
          this.destinationPath('examples/')
        );
      }
    }

    this.fs.copy(
      this.templatePath('raml2html-templates/*'),
      this.destinationPath('templates/')
    );

    this.fs.copy(
      this.templatePath('raml/*'),
      this.destinationPath('raml/')
    );

    this.fs.copy(
      this.templatePath('lib/*'),
      this.destinationPath('lib/')
    );
  },

  install: function () {
    this.npmInstall();
  }
});
