var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('build', function () {
    var tsProject = ts.createProject('./src/tsconfig.json');
    return tsProject.src()
        .pipe(ts(tsProject))
        .pipe(gulp.dest('./dist'));
});