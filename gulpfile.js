'use strict';

var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var jsdoc = require('gulp-jsdoc');

gulp.task('lint', function() {
  return gulp.src(['gulpfile.js', './generators/app/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function () {
    return gulp.src('./test/*.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha());
});

// jsdoc -a all -d docs/api -r --readme README.md generators/app/templates/lib/*.js generators/app/index.js
gulp.task('jsdoc', function () {
  return gulp.src(['README.md', './generators/app/*.js', './generators/app/templates/lib/*.js'])
    .pipe(jsdoc('./docs/api', null, null, {
      private: true}));
});

gulp.task('default', ['lint', 'test', 'jsdoc']);
