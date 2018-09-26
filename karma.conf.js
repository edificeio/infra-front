//jshint strict: false
module.exports = function (config) {
    config.set({
        basePath: '',
        files: [
            'node_modules/jquery/dist/jquery.js',
            'src/ts/ng-start.ts',
            'src/ts/modelDefinitions.ts',
            'src/ts/directives/userRole.ts',
            'src/ts/directives/userRole.spec.ts',
        ],
        preprocessors: {
            "src/**/*.ts": ["karma-typescript"]
        },

        reporters: ["progress", "karma-typescript"],
        singleRun: false,
        frameworks: ['jasmine', 'karma-typescript'],
        browsers: ['Firefox'],
        karmaTypescriptConfig: {
            tsconfig: "./tsconfig.json"
        },
    });
};
