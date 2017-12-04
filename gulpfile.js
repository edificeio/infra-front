var gulp = require('gulp');
var webpack = require('webpack-stream');
var glob = require("glob");
var rename = require('gulp-rename');
var argv = require('yargs').argv;

let springboardPath = '../springboard-open-ent';
if(argv.springboard){
    springboardPath = argv.springboard;
    console.log('Using springboard at ' + springboardPath);
}

gulp.task("build", function () {
    return gulp.src('./')
        .pipe(webpack(require('./webpack.config.js')))
        .on('error', function handleError() {
            this.emit('end');
        })
        .pipe(gulp.dest('./'));
});

gulp.task("build-dev", function () {
    webpack.plugins = [];
    return gulp.src('./')
        .pipe(webpack(require('./webpack-dev.config.js')))
        .on('error', function handleError() {
            this.emit('end');
        })
        .pipe(gulp.dest('./'));
});

gulp.task('update', ['build-dev'], () => {
    glob(springboardPath + '/mods/**/public/dist/entcore/*.js', (err, f) => {
        f.forEach((file) => {
            const split = file.split('/');
            const fileName = split[split.length - 1];
            gulp.src('./bundle/ng-app.js')
                .pipe(rename(fileName))
                .pipe(gulp.dest(split.slice(0, split.length - 1).join('/')));
        });
    });

    glob(springboardPath + '/mods/**/public/dist/entcore/*.js.map', (err, f) => {
        f.forEach((file) => {
            const split = file.split('/');
            const fileName = split[split.length - 1];
            gulp.src('./bundle/ng-app.js.map')
                .pipe(rename(fileName))
                .pipe(gulp.dest(split.slice(0, split.length - 1).join('/')));
        });
    });
})

gulp.task('watch', () => {
    gulp.watch('**/*.ts', () => gulp.start('update'));
    gulp.watch('**/*.html', () => {
        const apps = [];
        
        glob(springboardPath + '/mods/**/public/template/entcore/*.html', (err, f) => {
            f.forEach((file) => {
                const app = file.split('/public/template/entcore')[0];
                if(apps.indexOf(app) === -1){
                    apps.push(app);
                    console.log('copy to ' + app + '/public/template/entcore')
                    gulp.src('./src/template/**/*')
                        .pipe(gulp.dest(app + '/public/template/entcore'));
                }
            });
        });
    });
});