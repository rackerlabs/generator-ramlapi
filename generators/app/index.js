'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
// var ls = require('lodash/string');
var path = require('path');

module.exports = yeoman.generators.Base.extend({

    constructor: function () {
        yeoman.generators.Base.apply(this, arguments);

        // This makes `appname` a required argument.
        // this.argument('appname', { type: String, required: true });
        // And you can then access it later on this way; e.g. CamelCased
        // this.appname = ls.camelCase(this.appname);
    },

    prompting: function () {
        var done = this.async(),
            prompts = [{
                type: 'input',
                name: 'projectTitle',
                message: 'What is the name of your API? (example: "widget")',
                default: this.appname,
                store: true
            }, {
                type: 'input',
                name: 'projectDescription',
                message: 'Describe the API in one line.',
                default: function (answers) {
                    return answers.projectTitle + ' RAML API description and Schema validations.';
                },
                store: true
            }, {
                type: 'input',
                name: 'apiVersion',
                message: 'What semantic version do you want to use?',
                default: '0.1.0',
                validate: function (input) {
                    if (input.match(/(\d+)\.(\d+)\.(\d+)/)) {
                        return true;
                    }
                    return false;
                },
                store: true
            }, {
                type: 'input',
                name: 'authorName',
                message: 'What is your full name?',
                store: true
            }, {
                type: 'input',
                name: 'authorEmail',
                message: 'What is your email address?',
                store: true
            }, {
                type: 'input',
                name: 'authorUrl',
                message: 'What is your home or work URL?',
                store: true
            }, {
                type: 'input',
                name: 'repositoryType',
                message: 'What type of repository is this project stored in?',
                default: 'github',
                choices: ['github', 'git', 'svn', 'bitbucket'],
                store: true
            }, {
                type: 'input',
                name: 'repositoryUrl',
                message: 'What is the repository URL for this project?',
                store: true
            }, {
                type: 'input',
                name: 'projectHomePage',
                message: 'What is the home page URL for this project?',
                default: function (answers) {
                    if (answers.repositoryType === 'github' || answers.repositoryType === 'git') {
                        if (answers.repositoryUrl.indexOf('http') === 0) {
                            return path.dirname(answers.repositoryUrl) + '/' +
                                path.basename(answers.repositoryUrl, '.git');
                        }
                    }
                    return '';
                },
                store: true
            }, {
                type: 'input',
                name: "projectIssueTrackerUrl",
                message: 'What is the URL for the issue tracker for this project?',
                default: function (answers) {
                    if (answers.repositoryType === 'github' || answers.repositoryType === 'git') {
                        if (answers.projectHomePage.indexOf('http') === 0) {
                            return answers.projectHomePage + '/issues';
                        }
                    }
                    return '';
                },
                store: true
            }, {
                type: 'input',
                name: "license",
                message: 'What is the license for this project?',
                choices: ['Apache-2.0', 'GFDL-1.3', 'MIT', 'SEE LICENSE IN LICENSE'],
                default: 'Apache-2.0',
                store: true
            }];

        // Have Yeoman greet the user.
        this.log(yosay(
            'Welcome to the ' + chalk.red('RAML API Project') + ' generator!'
        ));

        this.prompt(prompts, function (props) {
            this.props = props;
            // To access props later use this.props.someOption;

            done();
        }.bind(this));
    },

    configuring: function () {
        this.config.save();
    },

    writing: function () {
        // TODO: perhaps make package.json added by API rather than file copy
        ['_LICENSE', '_package.json', '_README.md'].forEach(function (tplPath) {
            this.fs.copyTpl(
                this.templatePath(tplPath),
                this.destinationPath(tplPath.substr(1)),
                this.props
            );
        }, this);

        ['.gitignore', '.editorconfig'].forEach(function (tplPath) {
            this.fs.copy(
                this.templatePath(tplPath),
                this.destinationPath(tplPath)
            );
        }, this);

        this.fs.copy(
            this.templatePath('.gitkeep'),
            this.destinationPath('schema/.gitkeep')
        );

        this.fs.copy(
            this.templatePath('.gitkeep'),
            this.destinationPath('examples/.gitkeep')
        );

        this.fs.copy(
            this.templatePath('.gitkeep'),
            this.destinationPath('raml/.gitkeep')
        );

        if (!this.fs.exists('Gruntfile.js')) {
            this.gruntfile.loadNpmTasks('grunt-tv4');
            this.gruntfile.loadNpmTasks('grunt-raml2html');
            this.gruntfile.loadNpmTasks('grunt-json-schema-compose');
            this.gruntfile.loadNpmTasks('grunt-raml-api-project');

            this.gruntfile.insertConfig("pkg", "grunt.file.readJSON('package.json')");
            this.gruntfile.insertConfig("tv4",
                JSON.stringify({
                    options: {
                        multi: true,
                        fresh: true,
                        checkRecursive: false,
                        banUnknownProperties: true,
                        language: 'en'
                    }
                }));
            this.gruntfile.insertConfig("raml2html",
                JSON.stringify({
                    all: {
                        options: {
                            mainTemplate: 'template.nunjucks',
                            templatesPath: 'templates'
                        }
                    }
                }));

            // Default task(s).
            this.gruntfile.registerTask('default', [
                'scan_raml_project',
                'json_schema_compose',
                'tv4',
                'copy_raml_to_public',
                'raml2html']);
        }
    },

    install: function () {
        this.installDependencies();
    }
});