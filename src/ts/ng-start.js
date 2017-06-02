"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Controller = (function () {
    function Controller(name, contents) {
        this.name = name;
        this.contents = contents;
    }
    return Controller;
}());
exports.Controller = Controller;
var Directive = (function () {
    function Directive(name, contents) {
        this.name = name;
        this.contents = contents;
    }
    return Directive;
}());
exports.Directive = Directive;
var Filter = (function () {
    function Filter(name, contents) {
        this.name = name;
        this.contents = contents;
    }
    return Filter;
}());
exports.Filter = Filter;
var Ng = (function () {
    function Ng() {
        this.controllers = [];
        this.directives = [];
        this.filters = [];
        this.requiredModules = [];
    }
    Ng.prototype.init = function (module) {
        this.directives.forEach(function (dir) {
            module.directive(dir.name, dir.contents);
        });
        this.controllers.forEach(function (ctrl) {
            module.controller(ctrl.name, ctrl.contents);
        });
        this.filters.forEach(function (fil) {
            module.filter(fil.name, fil.contents);
        });
        this.requiredModules.forEach(function (m) {
            module.requires.push(m);
        });
    };
    Ng.prototype.directive = function (name, contents) {
        return new Directive(name, contents);
    };
    Ng.prototype.controller = function (name, contents) {
        return new Controller(name, contents);
    };
    Ng.prototype.filter = function (name, contents) {
        return new Filter(name, contents);
    };
    Ng.prototype.addRequiredModule = function (moduleName) {
        this.requiredModules.push(moduleName);
    };
    return Ng;
}());
exports.Ng = Ng;
;
exports.ng = new Ng();
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.ng = exports.ng;
//# sourceMappingURL=ng-start.js.map