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
gulp.task('clean:types', function (cb) {
    rimraf('./types/src', cb);
});
gulp.task("do-build", ["clean:types"], function () {
    return gulp.src('./')
        .pipe(webpack(require('./webpack.config.js')))
        .on('error', function handleError() {
            this.emit('end');
        })
        .pipe(gulp.dest('./'));
});
gulp.task("build", ["do-build"], function () {
    return gulp.src('./bundle/ng-app.js')
    .pipe(gap.prependText('window.springboardBuildDate="'+new Date().toISOString()+'";\n'))
    .pipe(gap.prependText('window.infrafrontVersion="'+pjson.version+'";\n'))
    .pipe(gulp.dest("./bundle/"));
});

gulp.task("build-dev", ["clean:types"], () => {
    webpack.plugins = [];
    return gulp.src('./')
        .pipe(webpack(require('./webpack-dev.config.js')))
        .on('error', function handleError() {
            this.emit('end');
        })
        .pipe(gulp.dest('./'));
});

gulp.task('update', ['build-dev'], () => {
    GlobManager.js().then(f => {
        //console.log("founded js: ",f.length,f.join(","))
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
})

gulp.task("watch", ["clean:types"], () => {
    gulp.watch('**/*.ts', () => gulp.start('update'));
    gulp.watch('**/*.html', () => {
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
    });
});

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
