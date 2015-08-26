module.exports = function (grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        force: true // force to continue even with errors.
      },
      all: ['Gruntfile.js', 'generators/**/*.js', 'test/**/*.js']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: true // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ['test/**/*.js'],
      },
    },
    watch: {
      files: ['generators/**/*.js', 'test/**/*.js'],
      tasks: ['jshint', 'mochaTest'],
      options: {
        spawn: false,
      },
    },
    jsdoc: {
      dist: {
        options: {
          destination: 'docs',
          package: 'package.json',
          readme: 'README.md',
          // private: true
        },
        src: ['generators/app/index.js', 'generators/app/templates/lib/*.js']
      }
    }
  });

  var defaultTestSrc = grunt.config('mochaTest.test.src');
  grunt.event.on('watch', function (action, filepath) {
    grunt.config('mochaTest.test.src', defaultTestSrc);
    if (filepath.match('test/')) {
      grunt.config('mochaTest.test.src', filepath);
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'jsdoc', 'mochaTest']);
};