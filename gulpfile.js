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
    GlobManager.js().then(f => {
        f.forEach((file) => {
            const split = file.split('/');
            const fileName = split[split.length - 1];
            console.log('Copying js to ' + split.slice(0, split.length - 1).join('/'));
            gulp.src('./bundle/ng-app.js')
                .pipe(rename(fileName))
                .pipe(gulp.dest(split.slice(0, split.length - 1).join('/')));
        });
    });
    GlobManager.jsMap().then(f => {
        f.forEach((file) => {
            const split = file.split('/');
            const fileName = split[split.length - 1];
            gulp.src('./bundle/ng-app.js.map')
                .pipe(rename(fileName))
                .pipe(gulp.dest(split.slice(0, split.length - 1).join('/')));
        });
    });
    cb();
}

function copyHtml(cb) {
    const apps = [];
    GlobManager.html().then(f => {
        f.forEach((file) => {
            const app = file.split('/public/template/entcore')[0];
            if (apps.indexOf(app) === -1) {
                apps.push(app);
                console.log('copy to ' + app + '/public/template/entcore')
                gulp.src('./src/template/**/*')
                    .pipe(gulp.dest(app + '/public/template/entcore'));
            }
        });
    })
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
    }
}

// Exports Tasks
exports.watch = gulp.parallel('watch-ts', 'watch-html');
// exports.watch = watchHtml;
// exports.watch = gulp.parallel(watchTs, watchHtml);
exports.build = gulp.series('clean:types','do-build', 'build');