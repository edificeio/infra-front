//jshint strict: false
module.exports = function (config) {
    config.set({
        basePath: '',
        files: [
            'node_modules/jquery/dist/jquery.js',
            'node_modules/mathjax/MathJax.js',
            'node_modules/angular/angular.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'node_modules/angular-route/angular-route.js',
            'node_modules/angular-sanitize/angular-sanitize.js',
            'src/ts/lib.ts',
            'src/ts/ng-start.ts',
            'src/ts/modelDefinitions.ts',
            'src/ts/http.ts',
            'src/ts/idiom.ts',
            'src/ts/calendar.ts',
            'src/ts/ui.ts',
            'src/ts/me.ts',
            'src/ts/skin.ts',
            'src/ts/globals.ts',
            'src/ts/notify.ts',
            'src/ts/workspace.ts',
            'src/ts/behaviours.ts',
            'src/ts/rights.ts',
            'src/ts/entcore.ts',
            'src/ts/sniplets.ts',
            'src/ts/template.ts',
            'src/ts/widget.ts',
            'src/ts/libs/**/*.ts',
            'src/ts/editor.ts',
            'src/ts/editor/**/*.ts',
            'src/ts/directives/userRole.ts',
            'src/ts/directives/userRole.spec.ts',
        ],
        preprocessors: {
            "src/**/*.ts": ["karma-typescript"]
        },

        reporters: ["progress", "karma-typescript"],
        singleRun: false,
        frameworks: ['jasmine', 'karma-typescript'],
        browsers: ['Chrome'],
        karmaTypescriptConfig: {
            tsconfig: "./tsconfig.json"
        },
    });
};
