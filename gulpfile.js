var gulp = require('gulp');
var ts = require('gulp-typescript');
var webpack = require('webpack-stream');
var merge = require('merge2');
var rev = require('gulp-rev');
var revReplace = require("gulp-rev-replace");
var clean = require('gulp-clean');
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('typescript');

function compileTs(){
    var tsProject = ts.createProject('./src/ts/tsconfig.json', {
        typescript: typescript
    });
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));
        
    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./temp'));
}

function startWebpack(isLocal) {
    return gulp.src('./temp')
        .pipe(webpack(require('./webpack-entcore.config.js')))
        .pipe(gulp.dest('./dist'))
        .pipe(rev())
        .pipe(gulp.dest('./dist'))
        .pipe(rev.manifest({ merge: true }))
        .pipe(gulp.dest('./'));
}

function updateRefs() {
    return gulp.src("./src/main/resources/view-src/**/*.html")
        .pipe(revReplace({manifest: gulp.src("./rev-manifest.json") }))
        .pipe(gulp.dest("./src/main/resources/view"));
}

gulp.task('ts', function () { return compileTs() });
gulp.task('webpack', ['ts'], function(){ return startWebpack() });

gulp.task('drop-old-files', ['webpack'], function () {
    return gulp.src(['./dist'], { read: false })
       .pipe(clean());
});

gulp.task('build', ['drop-old-files'], function () {
    var refs = updateRefs();
    return merge[refs, copyBehaviours];
});
