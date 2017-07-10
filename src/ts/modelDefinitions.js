"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Model = (function () {
    function Model(data) {
        if (data === void 0) { data = undefined; }
        if (typeof this.updateData === 'function') {
            this.updateData(data, false);
        }
    }
    return Model;
}());
exports.Model = Model;
Model.prototype.build = function () { };
var BaseModel = (function (_super) {
    __extends(BaseModel, _super);
    function BaseModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BaseModel.prototype.build = function () {
    };
    return BaseModel;
}(Model));
exports.BaseModel = BaseModel;
exports.model = new BaseModel();
var Collection = (function () {
    function Collection(obj) {
        this.all = [];
        this.obj = obj;
        this.callbacks = {};
        this.sync = function () {
        };
    }
    return Collection;
}());
exports.Collection = Collection;
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.model = exports.model;
window.model = exports.model;
window.entcore.Model = Model;
window.Model = Model;
window.entcore.Collection = Collection;
//# sourceMappingURL=modelDefinitions.js.map