// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('test', function () {
    return gulp.src('test/*.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it 
        .pipe(mocha({ui: 'bdd'}));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(['js/*.js', 'test/*.js'], ['test']);
});

// Default Task
gulp.task('default', ['lint', 'test', 'watch']);
