var gulp = require('gulp');
var webpack = require('webpack-stream');
var glob = require('glob');
var rename = require('gulp-rename');
var argv = require('yargs').argv;
var rimraf = require("rimraf");
var gap = require('gulp-append-prepend');
var pjson = require('./package.json');

let springboardPath = '../recette';
if (argv.springboard) {
    springboardPath = argv.springboard;
    console.log('Using springboard at ' + springboardPath);
}

function cleanTypes(cb) {
    rimraf('./types/src', cb);
}

function doBuild() {
    return gulp.src('./')
        .pipe(webpack(require('./webpack.config.js')))
        .on('error', function handleError() {
            this.emit('end');
        })
        .pipe(gulp.dest('./'));
}

function build() {
    return gulp.src('./bundle/ng-app.js')
    .pipe(gap.prependText('window.springboardBuildDate="'+new Date().toISOString()+'";\n'))
    .pipe(gap.prependText('window.infrafrontVersion="'+pjson.version+'";\n'))
    .pipe(gulp.dest("./bundle/"));
}

function buildDev() {
    webpack.plugins = [];
    return gulp.src('./')
        .pipe(webpack(require('./webpack-dev.config.js')))
        .on('error', function handleError() {
            this.emit('end');
        })
        .pipe(gulp.dest('./'));
}

function update(cb) {
    console.log('Copying js to ' + springboardPath + '/assets/js/entcore/ng-app.js'); 
    gulp.src('./bundle/ng-app.js').pipe(gulp.dest(springboardPath + '/assets/js/entcore/'));
    //gulp.src('./bundle/ng-app.js.map').pipe(gulp.dest(springboardPath + '/assets/js/entcore/'));
    cb();
}

function copyHtml(cb) {
    console.log('copy to ' + springboardPath + '/assets/js/entcore/template')
    gulp.src('./src/template/**/*').pipe(gulp.dest(springboardPath + '/assets/js/entcore/template'));
    cb();
}

gulp.task('clean:types', cleanTypes);
gulp.task("do-build", doBuild);
gulp.task("build", build);
gulp.task("build-dev", buildDev);
gulp.task('update', update);
gulp.task('copy-html', copyHtml);

function watchTs() {
    return gulp.watch('./src/ts/**/*.ts', gulp.series('clean:types','build-dev','update'));
}

function watchHtml() {
    return gulp.watch('./src/template/**/*.html', gulp.series('clean:types', 'copy-html'));
}

gulp.task('watch-ts', watchTs);
gulp.task('watch-html', watchHtml);

const GlobManager = {
    _js: null,
    _jsMap: null,
    _html: null,
    _templates: null,
    _buildPromise: (path) => {
        return new Promise((resolve, reject) => {
            console.log("init glob for: ",path)
            glob(path, (err, f) => {
                if (err) {
                    reject(err); 
                } else {
                    resolve(f);
                }
            })
        })
    },
    js: () => {
        if (!GlobManager._js) {
            GlobManager._js = GlobManager._buildPromise(springboardPath + '/mods/**/public/dist/entcore/*.js')
        }
        return GlobManager._js;
    },
    jsMap: () => {
        if (!GlobManager._jsMap) {
            GlobManager._jsMap = GlobManager._buildPromise(springboardPath + '/mods/**/public/dist/entcore/*.js.map')
        }
        return GlobManager._jsMap;
    },
    html: () => {
        if (!GlobManager._html) {
            GlobManager._html = GlobManager._buildPromise(springboardPath + '/mods/**/public/template/entcore/*.html')
        }
        return GlobManager._html;
    },
    templates: () => {
        if (!GlobManager._templates) {
            GlobManager._templates = GlobManager._buildPromise('./src/template/**/*.html')
        }
        return GlobManager._templates;
    }
}

// Exports Tasks
exports.watch = gulp.parallel('watch-ts', 'watch-html');
exports.build = gulp.series('clean:types','do-build', 'build');