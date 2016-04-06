var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');

gulp.task('build', function () {
    var tsProject = ts.createProject('./src/tsconfig.json');
    var tsResult = tsProject.src()
        .pipe(ts(tsProject));
        
    return merge([
        tsResult.dts.pipe(gulp.dest('./definitions')),
        tsResult.js.pipe(gulp.dest('./dist'))
    ]);
});