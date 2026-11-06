var gulp = require('gulp');
var webpack = require('webpack-stream');
var glob = require('glob');
var rename = require('gulp-rename');
var argv = require('yargs').argv;
var rimraf = require("rimraf");
var gap = require('gulp-append-prepend');
var pjson = require('./package.json');
var fs = require('fs');
var UglifyJS = require('uglify-js');

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

// The bundle is minified here rather than by a webpack plugin: the webpack that
// runs is the 1.15 embedded in webpack-stream, whose only usable minifier plugin
// (uglifyjs-webpack-plugin 0.4.x) drives UglifyJS 2 through its internal API.
// UglifyJS 2 only parses ES5, so it fails ("Invalid assignment") as soon as a
// bundled dependency ships ES2015 (e.g. entcore-toolkit's dist/http.js), and the
// plugin cannot be pointed at uglify-js 3 (it calls uglify.base54, gone in 3.x).
function minify(cb) {
    var file = './bundle/ng-app.js';
    var result = UglifyJS.minify(fs.readFileSync(file, 'utf8'), {
        sourceMap: { content: fs.readFileSync(file + '.map', 'utf8'), url: 'ng-app.js.map' },
        output: { comments: /^\**!|@preserve|@license/ }
    });
    if (result.error) {
        return cb(result.error);
    }
    fs.writeFileSync(file, result.code);
    fs.writeFileSync(file + '.map', result.map);
    cb();
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
gulp.task("minify", minify);
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
exports.build = gulp.series('clean:types','do-build', 'minify', 'build');