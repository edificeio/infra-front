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
var http_1 = require("./http");
var behaviours_1 = require("./behaviours");
var moment_1 = require("./libs/moment/moment");
var modelDefinitions_1 = require("./modelDefinitions");
var underscore_1 = require("./libs/underscore/underscore");
var notify_1 = require("./notify");
var idiom_1 = require("./idiom");
var Quota = (function (_super) {
    __extends(Quota, _super);
    function Quota() {
        var _this = _super.call(this) || this;
        _this.max = 1;
        _this.used = 0;
        _this.unit = 'Mo';
        return _this;
    }
    Quota.prototype.appropriateDataUnit = function (bytes) {
        var order = 0;
        var orders = {
            0: idiom_1.idiom.translate("byte"),
            1: "Ko",
            2: "Mo",
            3: "Go",
            4: "To"
        };
        var finalNb = bytes;
        while (finalNb >= 1024 && order < 4) {
            finalNb = finalNb / 1024;
            order++;
        }
        return {
            nb: finalNb,
            order: orders[order]
        };
    };
    Quota.prototype.refresh = function () {
        var _this = this;
        http_1.http().get('/workspace/quota/user/' + modelDefinitions_1.model.me.userId).done(function (data) {
            //to mo
            data.quota = data.quota / (1024 * 1024);
            data.storage = data.storage / (1024 * 1024);
            if (data.quota > 2000) {
                data.quota = Math.round((data.quota / 1024) * 10) / 10;
                data.storage = Math.round((data.storage / 1024) * 10) / 10;
                _this.unit = 'Go';
            }
            else {
                data.quota = Math.round(data.quota);
                data.storage = Math.round(data.storage);
            }
            _this.max = data.quota;
            _this.used = data.storage;
            _this.trigger('change');
        });
    };
    return Quota;
}(modelDefinitions_1.Model));
;
exports.quota = new Quota();
var Revision = (function (_super) {
    __extends(Revision, _super);
    function Revision(data) {
        return _super.call(this, data) || this;
    }
    return Revision;
}(modelDefinitions_1.Model));
exports.Revision = Revision;
var Document = (function (_super) {
    __extends(Document, _super);
    function Document(data) {
        var _this = _super.call(this, data) || this;
        if (data.metadata) {
            var dotSplit = data.metadata.filename.split('.');
            if (dotSplit.length > 1) {
                dotSplit.length = dotSplit.length - 1;
            }
            _this.title = dotSplit.join('.');
            _this.metadata.role = _this.role();
        }
        if (data.created) {
            _this.created = moment_1.moment(data.created.split('.')[0]);
        }
        else if (data.sent) {
            _this.created = moment_1.moment(data.sent.split('.')[0]);
        }
        else {
            _this.created = moment_1.moment();
        }
        _this.owner = { userId: data.owner };
        _this.version = parseInt(Math.random() * 100);
        _this.link = '/workspace/document/' + _this._id;
        if (_this.metadata.role === 'img') {
            _this.icon = _this.link;
        }
        _this.collection(Revision);
        return _this;
    }
    Document.prototype.refreshHistory = function (hook) {
        var _this = this;
        http_1.http().get("document/" + this._id + "/revisions").done(function (revisions) {
            _this.revisions.load(revisions);
            if (typeof hook === 'function') {
                hook();
            }
        });
    };
    Document.prototype.upload = function (file, requestName, callback, visibility) {
        if (!visibility) {
            visibility = 'protected';
        }
        var formData = new FormData();
        formData.append('file', file, file.name);
        http_1.http().postFile('/workspace/document?' + visibility + '=true&application=media-library&quality=0.7&' + exports.workspace.thumbnails, formData, { requestName: requestName }).done(function (data) {
            if (typeof callback === 'function') {
                callback(data);
            }
        }).e400(function (e) {
            var error = JSON.parse(e.responseText);
            notify_1.notify.error(error.error);
        });
    };
    Document.prototype.role = function () {
        return Document.role(this.metadata['content-type']);
    };
    Document.prototype.protectedDuplicate = function (callback) {
        behaviours_1.Behaviours.applicationsBehaviours.workspace.protectedDuplicate(this, function (data) {
            if (typeof callback === 'function') {
                callback(new exports.workspace.Document(data));
            }
        });
    };
    Document.prototype.publicDuplicate = function (callback) {
        behaviours_1.Behaviours.applicationsBehaviours.workspace.publicDuplicate(this, function (data) {
            if (typeof callback === 'function') {
                callback(new exports.workspace.Document(data));
            }
        });
    };
    Document.role = function (fileType) {
        if (!fileType)
            return 'unknown';
        var types = {
            'doc': function (type) {
                return type.indexOf('document') !== -1 && type.indexOf('wordprocessing') !== -1;
            },
            'xls': function (type) {
                return (type.indexOf('document') !== -1 && type.indexOf('spreadsheet') !== -1) || (type.indexOf('ms-excel') !== -1);
            },
            'img': function (type) {
                return type.indexOf('image') !== -1;
            },
            'pdf': function (type) {
                return type.indexOf('pdf') !== -1 || type === 'application/x-download';
            },
            'ppt': function (type) {
                return (type.indexOf('document') !== -1 && type.indexOf('presentation') !== -1) || type.indexOf('powerpoint') !== -1;
            },
            'video': function (type) {
                return type.indexOf('video') !== -1;
            },
            'audio': function (type) {
                return type.indexOf('audio') !== -1;
            },
            'zip': function (type) {
                return type.indexOf('zip') !== -1 ||
                    type.indexOf('rar') !== -1 ||
                    type.indexOf('tar') !== -1 ||
                    type.indexOf('7z') !== -1;
            }
        };
        for (var type in types) {
            if (types[type](fileType)) {
                return type;
            }
        }
        return 'unknown';
    };
    Document.prototype.trash = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            http_1.http().put('/workspace/document/trash/' + _this._id).done(function () {
                resolve();
            });
        });
    };
    return Document;
}(modelDefinitions_1.Model));
exports.Document = Document;
exports.workspace = {
    thumbnails: "thumbnail=120x120&thumbnail=150x150&thumbnail=100x100&thumbnail=290x290&thumbnail=48x48&thumbnail=82x82&thumbnail=381x381&thumbnail=1600x0",
    Document: Document,
    upload: function (file, visibility) {
        if (!visibility) {
            visibility = 'protected';
        }
        return new Promise(function (resolve, reject) {
            exports.workspace.Document.prototype.upload(file, '', function (file) {
                var doc = new Document(file);
                resolve(doc);
            }, visibility);
        });
    },
    Folder: function (data) {
        this.updateData(data);
        this.collection(exports.workspace.Folder, {
            sync: function () {
                this.load(underscore_1._.filter(modelDefinitions_1.model.mediaLibrary.myDocuments.folders.list, function (folder) {
                    return folder.folder.indexOf(data.folder + '_') !== -1;
                }));
            }
        });
        this.collection(exports.workspace.Document, {
            sync: function () {
                http_1.http().get('/workspace/documents/' + data.folder, { filter: 'owner', hierarchical: true }).done(function (documents) {
                    this.load(documents);
                }.bind(this));
            }
        });
        this.closeFolder = function () {
            this.folders.all = [];
        };
        this.on('documents.sync', function () {
            this.trigger('sync');
        }.bind(this));
    },
    MyDocuments: function () {
        this.collection(exports.workspace.Folder, {
            sync: function () {
                if (modelDefinitions_1.model.me.workflow.workspace.create) {
                    http_1.http().get('/workspace/folders/list', { filter: 'owner' }).done(function (data) {
                        this.list = data;
                        this.load(underscore_1._.filter(data, function (folder) {
                            return folder.folder.indexOf('_') === -1;
                        }));
                    }.bind(this));
                }
            },
            list: []
        });
        this.collection(exports.workspace.Document, {
            sync: function () {
                http_1.http().get('/workspace/documents', { filter: 'owner', hierarchical: true }).done(function (documents) {
                    this.load(documents);
                }.bind(this));
            }
        });
        this.on('folders.sync, documents.sync', function () {
            this.trigger('sync');
        }.bind(this));
    },
    SharedDocuments: function () {
        this.collection(exports.workspace.Document, {
            sync: function () {
                if (modelDefinitions_1.model.me.workflow.workspace.list) {
                    http_1.http().get('/workspace/documents', { filter: 'shared' }).done(function (documents) {
                        this.load(documents);
                    }.bind(this));
                }
            }
        });
        this.on('documents.sync', function () {
            this.trigger('sync');
        }.bind(this));
    },
    PublicDocuments: function () {
        this.collection(exports.workspace.Document, {
            sync: function () {
                http_1.http().get('/workspace/documents', { filter: 'public', application: 'media-library' }).done(function (documents) {
                    this.load(underscore_1._.filter(documents, function (doc) {
                        return doc.folder !== 'Trash';
                    }));
                }.bind(this));
            }
        });
        this.on('documents.sync', function () {
            this.trigger('sync');
        }.bind(this));
    },
    AppDocuments: function () {
        this.collection(exports.workspace.Document, {
            sync: function () {
                http_1.http().get('/workspace/documents', { filter: 'protected' }).done(function (documents) {
                    this.load(underscore_1._.filter(documents, function (doc) {
                        return doc.folder !== 'Trash';
                    }));
                }.bind(this));
            }
        });
        this.on('documents.sync', function () {
            this.trigger('sync');
        }.bind(this));
    }
};
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.workspace = exports.workspace;
window.entcore.quota = exports.quota;
window.workspace = exports.workspace;
//# sourceMappingURL=workspace.js.map