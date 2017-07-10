"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var modelDefinitions_1 = require("./modelDefinitions");
var skin_1 = require("./skin");
var http_1 = require("./http");
var moment_1 = require("./libs/moment/moment");
exports.quickstart = {
    steps: {},
    state: {},
    types: {
        ENSEIGNANT: 'teacher',
        ELEVE: 'student',
        PERSEDUCNAT: 'personnel',
        PERSRELELEVE: 'relative'
    },
    mySteps: [],
    assistantIndex: {},
    assistantStep: function (index) {
        return skin_1.skin.basePath + 'template/assistant/' + this.types[modelDefinitions_1.model.me.type] + '/' + index + '.html';
    },
    nextAssistantStep: function () {
        this.state.assistant++;
        if (this.state.assistant === this.steps[this.types[modelDefinitions_1.model.me.type]]) {
            this.state.assistant = -1;
            this.assistantIndex = undefined;
        }
        else {
            this.assistantIndex = this.mySteps[this.state.assistant];
        }
        this.save();
    },
    seeAssistantLater: function () {
        this.state.assistantTimer = moment_1.moment().format('MM/DD/YYYY HH:mm');
        this.save();
    },
    nextAppStep: function () {
        this.state[skin_1.skin.skin][this.app]++;
        this.save();
        return this.state[skin_1.skin.skin][this.app];
    },
    previousAppStep: function () {
        this.state[skin_1.skin.skin][this.app]--;
        this.save();
        return this.state[skin_1.skin.skin][this.app];
    },
    goToAppStep: function (index) {
        this.state[skin_1.skin.skin][this.app] = index;
        this.save();
        return index;
    },
    closeApp: function () {
        this.state[skin_1.skin.skin][this.app] = -1;
        this.save();
    },
    appIndex: function () {
        this.app = window.location.href.split('//')[1].split('/').slice(1).join('/');
        if (!this.state[skin_1.skin.skin]) {
            this.state[skin_1.skin.skin] = {};
        }
        if (!this.state[skin_1.skin.skin][this.app]) {
            this.state[skin_1.skin.skin][this.app] = 0;
        }
        return this.state[skin_1.skin.skin][this.app];
    },
    previousAssistantStep: function () {
        this.state.assistant--;
        if (this.state.assistant < 0) {
            this.state.assistant = 0;
        }
        this.assistantIndex = this.mySteps[this.state.assistant];
        this.save();
    },
    save: function (cb) {
        http_1.http().putJson('/userbook/preference/quickstart', this.state).done(function () {
            if (typeof cb === 'function') {
                cb();
            }
        });
    },
    goTo: function (index) {
        if (index > this.mySteps.length) {
            index = -1;
        }
        this.state.assistant = index;
        if (index !== -1) {
            this.assistantIndex = this.mySteps[index];
        }
        this.save();
    },
    loaded: false,
    awaiters: [],
    load: function (cb) {
        if (this.loaded) {
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }
        this.awaiters.push(cb);
        if (this.loading) {
            return;
        }
        this.loading = true;
        http_1.http().get('/userbook/preference/quickstart').done(function (pref) {
            var preferences;
            if (pref.preference) {
                try {
                    preferences = JSON.parse(pref.preference);
                }
                catch (e) {
                    console.log('Error parsing quickstart preferences');
                }
            }
            if (!preferences) {
                preferences = {};
            }
            if (!preferences.assistant) {
                preferences.assistant = 0;
            }
            if (!preferences[skin_1.skin.skin]) {
                preferences[skin_1.skin.skin] = {};
            }
            this.state = preferences;
            if (preferences.assistant !== -1 && !(preferences.assistantTimer
                && moment_1.moment(preferences.assistantTimer).year() === moment_1.moment().year()
                && moment_1.moment(preferences.assistantTimer).dayOfYear() === moment_1.moment().dayOfYear()
                && moment_1.moment(preferences.assistantTimer).hour() === moment_1.moment().hour())) {
                http_1.http().get(skin_1.skin.basePath + 'template/assistant/steps.json').done(function (steps) {
                    this.steps = steps;
                    var nbSteps = this.steps[this.types[modelDefinitions_1.model.me.type]];
                    for (var i = 0; i < nbSteps; i++) {
                        this.mySteps.push({
                            index: i,
                            path: this.assistantStep(i)
                        });
                        this.assistantIndex = this.mySteps[this.state.assistant];
                    }
                    this.loaded = true;
                    this.awaiters.forEach(function (cb) {
                        if (typeof cb === 'function') {
                            cb();
                        }
                    });
                }.bind(this));
            }
            else {
                this.loaded = true;
                this.awaiters.forEach(function (cb) {
                    if (typeof cb === 'function') {
                        cb();
                    }
                });
            }
        }.bind(this));
    }
};
//# sourceMappingURL=quickstart.js.map