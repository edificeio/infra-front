import { http } from './http';
import { Behaviours } from './behaviours';
import { moment } from './libs/moment/moment';
import { model } from './entcore';
import { _ } from './libs/underscore/underscore';
import { notify } from './notify';

export var workspace = {
	thumbnails: "thumbnail=120x120&thumbnail=150x150&thumbnail=100x100&thumbnail=290x290&thumbnail=48x48&thumbnail=82x82&thumbnail=381x381",
	Document: function(data){
		if(data.metadata){
			var dotSplit = data.metadata.filename.split('.');
			if(dotSplit.length > 1){
				dotSplit.length = dotSplit.length - 1;
			}
			this.title = dotSplit.join('.');
		}

		this.protectedDuplicate = function(callback){
			var document = this;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', '/workspace/document/' + this._id, true);
			xhr.responseType = 'blob';
			xhr.onload = function(e) {
				if (this.status == 200) {
					var blobDocument = this.response;
					var formData = new FormData();
					formData.append('file', blobDocument, document.metadata.filename);
					http().postFile('/workspace/document?protected=true&application=media-library&' + workspace.thumbnails, formData).done(function(data){
						if(typeof callback === 'function'){
							callback(new workspace.Document(data));
						}
					});
				}
			};
			xhr.send();
		};

		this.role = function(){
			var types = {
				'doc': function(type){
					return type.indexOf('document') !== -1 && type.indexOf('wordprocessing') !== -1;
				},
				'xls': function(type){
					return (type.indexOf('document') !== -1 && type.indexOf('spreadsheet') !== -1) || (type.indexOf('ms-excel') !== -1);
				},
				'img': function(type){
					return type.indexOf('image') !== -1;
				},
				'pdf': function(type){
					return type.indexOf('pdf') !== -1;
				},
				'ppt': function(type){
					return (type.indexOf('document') !== -1 && type.indexOf('presentation') !== -1) || type.indexOf('powerpoint') !== -1;
				},
				'video': function(type){
					return type.indexOf('video') !== -1;
				},
				'audio': function(type){
					return type.indexOf('audio') !== -1;
				}
			};

			for(var type in types){
				if(types[type](this.metadata['content-type'])){
					return type;
				}
			}

			return 'unknown';
		}
	},
	Folder: function(data){
		this.updateData(data);

		this.collection(workspace.Folder, {
			sync: function(){
				this.load(_.filter(model.mediaLibrary.myDocuments.folders.list, function(folder){
					return folder.folder.indexOf(data.folder + '_') !== -1;
				}));
			}
		});

		this.collection(workspace.Document,  {
			sync: function(){
				http().get('/workspace/documents/' + data.folder, { filter: 'owner', hierarchical: true }).done(function(documents){
					this.load(documents);
				}.bind(this));
			}
		});

		this.closeFolder = function(){
			this.folders.all = [];
		};

		this.on('documents.sync', function(){
			this.trigger('sync');
		}.bind(this));
	},
	MyDocuments: function(){
		this.collection(workspace.Folder, {
			sync: function(){
				if(model.me.workflow.workspace.documents.create){
					http().get('/workspace/folders/list', { filter: 'owner' }).done(function(data){
						this.list = data;
						this.load(_.filter(data, function(folder){
							return folder.folder.indexOf('_') === -1;
						}))
					}.bind(this));
				}
			},
			list: []
		});

		this.collection(workspace.Document,  {
			sync: function(){
				http().get('/workspace/documents', { filter: 'owner', hierarchical: true }).done(function(documents){
					this.load(documents);
				}.bind(this))
			}
		});

		this.on('folders.sync, documents.sync', function(){
			this.trigger('sync');
		}.bind(this));
	},
	SharedDocuments: function(){
		this.collection(workspace.Document,  {
			sync: function(){
				if(model.me.workflow.workspace.documents.list){
					http().get('/workspace/documents', { filter: 'shared' }).done(function(documents){
						this.load(documents);
					}.bind(this));
				}
			}
		});
		this.on('documents.sync', function(){
			this.trigger('sync');
		}.bind(this));
	},
	AppDocuments: function(){
		this.collection(workspace.Document, {
			sync: function(){
				http().get('/workspace/documents', { filter: 'protected' }).done(function(documents){
					this.load(_.filter(documents, function(doc){
						return doc.folder !== 'Trash';
					}));
				}.bind(this))
			}
		});
		this.on('documents.sync', function(){
			this.trigger('sync');
		}.bind(this));
	}
};

workspace.Document.prototype.upload = function(file, requestName, callback){
	var formData = new FormData();
	formData.append('file', file, file.name);
	http().postFile('/workspace/document?protected=true&application=media-library&' + workspace.thumbnails, formData, { requestName: requestName }).done(function(data){
		if(typeof callback === 'function'){
			callback(data);
		}
	}).e400(function(e){
		var error = JSON.parse(e.responseText);
		notify.error(error.error);
	});
};