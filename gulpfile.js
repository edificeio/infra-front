var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');
var watch = require('gulp-watch');

gulp.task('build', function () {
    var tsProject = ts.createProject('./src/tsconfig.json');
    var tsResult = tsProject.src()
        .pipe(ts(tsProject));
        
    return merge([
        tsResult.dts.pipe(gulp.dest('./definitions')),
        tsResult.js.pipe(gulp.dest('./dist'))
    ]);
});

gulp.task('watch', function(){
    watch('**/*.ts', function(){
        var tsProject = ts.createProject('./src/tsconfig.json');
        var tsResult = tsProject.src()
            .pipe(ts(tsProject));
            
        merge([
            tsResult.dts.pipe(gulp.dest('./definitions')),
            tsResult.js.pipe(gulp.dest('./dist'))
        ]);
    })
})