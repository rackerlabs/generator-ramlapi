'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash/string');
var path = require('path');
var glob = require('glob');
var async = require('async');
var ramlParser = require('raml-parser');

// Configuration Options and defaults
// name                   | existing project default   | new project default
// =======================|============================|=====================
// projectTitle           | raml:title                 | titleize({this.appname})
// projectName            | (kebabCase of title)       | kebabCase({this.appname})
// projectDescription     | raml:documentation.content | {projectTitle} RAML API description and Schema validations.
// baseUri                | raml:baseUri               | https://{projectName}.example.com/{version}
// version                | raml.version               | v1
// apiVersion             | pkg:version                | 1.0.0
// authorName             | pkg:author.name            |
// authorEmail            | pkg:author.email           |
// authorUrl              | pkg.author.url             |
// repositoryType         | pkg.repository.type        | github
// repositoryUrl          | pkg.repository.type        |
// projectHomePage        | pkg.homepage               | (derived from repository URL if git/github)
// projectIssueTrackerUrl | pkg.bugs.url               | (derived from repository URL if git/github)
// license                | pkg.license                | See LICENSE in LICENSE
// ramlFile               | raml file                  | {projectName}-{version}

function titleize(s) {
  return s;
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

function readPackageFile(defs, callback) {
  if (this.fs.exists('./package.json')) {
    var pkg = this.fs.readJSON('package.json');
    if (pkg.author) {
      if (pkg.author.name) {
        defs.authorName = pkg.author.name;
      }
      if (pkg.author.email) {
        defs.authorEmail = pkg.author.email;
      }
      if (pkg.author.url) {
        defs.authorUrl = pkg.author.url;
      }
    }
    if (pkg.repository) {
      if (pkg.repository.type) {
        defs.repositoryType = pkg.repository.type;
      }
      if (pkg.repository.url) {
        defs.repositoryUrl = pkg.repository.url;
      }
    }
    if (pkg.homepage) {
      defs.projectHomePage = pkg.homepage;
    }
    if (pkg.bugs && pkg.bugs.url) {
      defs.projectIssueTrackerUrl = pkg.bugs.url;
    }
    if (pkg.license) {
      defs.license = pkg.license;
    }
    if (pkg.version) {
      defs.version = pkg.version;
    }
    this._pkg = pkg;
  }

  callback(null, defs);
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
        readRamlFile,
        readPackageFile.bind(this));

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
        defs, titleize(this.appname)),
      _input('projectName', 'What is the name of your API? (example: "widget-warehouse")',
        defs, _.kebabCase(this.appname), {
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
            return answers.projectTitle + ' RAML API description and Schema validations.';
          }
        }),
      _input('version', 'What semantic version do you want to use?',
        defs, '1.0.0', {
          validate: function (input) {
            if (input.match(/(\d+)\.(\d+)\.(\d+)/)) {
              return true;
            }
            return 'Semantic versions are of the form 1.2.3';
          }
        }),
      _input('apiVersion', 'What API version do you want to use?',
        defs, 'v1', {
          validate: function (input) {
            if (input.match(/v?(\d+)(\.(\d+))?/)) {
              return true;
            }
            return 'Valid versions are: v1, v2.2, 3, 4.21';
          }
        }),
      _input('baseUri', 'What is the API\'s baseUri?',
        defs, null, {
          default: function (answers) {
            return 'https://' + answers.projectName + '.example.com';
          }
        }),
      _input('authorName', 'What is your full name?', defs),
      _input('authorEmail', 'What is your email address?', defs),
      _input('authorUrl', 'What is your home or work URL?', defs),
      _input('repositoryType', 'What type of repository is this project stored in?',
        defs, null, {
          type: 'list',
          choices: ['github', 'git', 'svn', 'bitbucket']
        }),
      _input('repositoryUrl', 'What is the repository URL for this project?', defs),
      _input('projectHomePage', 'What is the home page URL for this project?', defs, null, {
        default: function (answers) {
          if (!answers.repositoryType || !answers.repositoryUrl) {
            return null;
          }
          if (answers.repositoryType === 'github' || answers.repositoryType === 'git') {
            if (answers.repositoryUrl.indexOf('http') === 0) {
              return path.dirname(answers.repositoryUrl) + '/' +
                path.basename(answers.repositoryUrl, '.git');
            }
          }
          return null;
        }
      }),
      _input('projectIssueTrackerUrl', 'What is the URL for the issue tracker for this project?', defs, null, {
        default: function (answers) {
          if (answers.repositoryType === 'github' || answers.repositoryType === 'git') {
            if (answers.projectHomePage && answers.projectHomePage.indexOf('http') === 0) {
              return answers.projectHomePage + '/issues';
            }
          }
          return null;
        }
      }),
      _input('license', 'What is the license for this project?',
        defs, 'Apache-2.0', {
          type: 'list',
          choices: ['Apache-2.0', 'GFDL-1.3', 'MIT', 'SEE LICENSE IN LICENSE']
        })
    ];
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
    this.props.mainRamlFile = this.props.mainRamlFile || this.props.projectName + '-' + this.props.apiVersion + '.raml';
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
      this._pkg.version = this.props.version;
    }
    this._pkg.author = this._pkg.author || {};
    if (!this._pkg.author.hasOwnProperty('name')) {
      this._pkg.author.name = this.props.authorName;
    }
    if (!this._pkg.author.hasOwnProperty('email')) {
      this._pkg.author.email = this.props.authorEmail;
    }
    if (!this._pkg.author.hasOwnProperty('url')) {
      this._pkg.author.url = this.props.authorUrl;
    }
    if (!this._pkg.hasOwnProperty('homepage')) {
      this._pkg.homepage = this.props.homepage;
    }
    this._pkg.bugs = this._pkg.bugs || {};
    if (!this._pkg.bugs.hasOwnProperty('url')) {
      this._pkg.bugs.url = this.props.projectIssueTrackerUrl;
    }
    if (!this._pkg.hasOwnProperty('license')) {
      this._pkg.license = this.props.license;
    }
    this._pkg.repository = this._pkg.repository || {};
    if (!this._pkg.repository.hasOwnProperty('type')) {
      this._pkg.repository.type = this.props.repositoryType;
    }
    if (!this._pkg.repository.hasOwnProperty('url')) {
      this._pkg.repository.url = this.props.repositoryUrl;
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
    this._pkg.dependencies['gulp-rename'] = '^1.2.2';
    this._pkg.dependencies['gulp-util'] = '^3.0.6';
    this._pkg.dependencies['gulp-watch'] = '^4.3.4';
    this._pkg.dependencies['js-yaml'] = '^3.3.1';
    this._pkg.dependencies['json-schema-ref-parser'] = '^1.0.0-alpha.10';
    this._pkg.dependencies['map-stream'] = '0.0.6';
    this._pkg.dependencies['raml-parser'] = '^0.8.11';
    this._pkg.dependencies.raml2html = '^2.0.2';
    this._pkg.dependencies.ramllint = '^1.2.2';
    this._pkg.dependencies.through2 = '^2.0.0';
    this._pkg.dependencies.traverse = '^0.6.6';
    this._pkg.dependencies.tv4 = '^1.1.9';
    this.fs.writeJSON(this.destinationPath('package.json'), this._pkg);
  },

  writing: function () {
    this._writePackageJson();
    ['_.gitignore', '_.editorconfig', '_LICENSE', '_README.md', '_gulpfile.js'].forEach(function (tplPath) {
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