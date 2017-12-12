import { appPrefix } from '../globals';
import { ng } from '../ng-start';
import { $ } from "../libs/jquery/jquery";
import { MediaLibrary, Document, DocumentStatus } from '../workspace';
import { template } from '../template';
import { model } from '../modelDefinitions';
import { idiom } from '../idiom';
import http from 'axios';

export const mediaLibrary = ng.directive('mediaLibrary', function(){
	return {
		restrict: 'E',
		scope: {
			ngModel: '=',
			ngChange: '&',
			multiple: '=',
			fileFormat: '='
		},
		templateUrl: '/' + appPrefix + '/public/template/entcore/media-library/main.html',
		link: function(scope, element, attributes){
			scope.template = template;

			if(!(window as any).toBlobPolyfillLoaded){
                http.get('/infra/public/js/toBlob-polyfill.js').then((response) => {
                    eval(response.data);
                    (window as any).toBlobPolyfillLoaded = true;
                });
            }

			scope.$watch(function(){
				return scope.$parent.$eval(attributes.visibility);
			}, function(newVal){
				scope.visibility = newVal;
				if(!scope.visibility){
					scope.visibility = 'protected';
				}
				scope.visibility = scope.visibility.toLowerCase();
			});

			scope.openCompression = (doc: Document) => {
				if(!doc.isEditableImage){
					return;
				}
				scope.display.editedDocument = doc;
				setTimeout(() => {
					scope.display.compressionReady = true;
					scope.$apply();
				}, 350);
			};

			scope.closeCompression = () => {
				scope.display.editedDocument = undefined;
				scope.display.compressionReady = false;
			}

			scope.upload = {
				documents: [],
				highlights: []
			};

			element.on('dragenter', (e) => {
				e.preventDefault();
			});

			element.on('dragover', (e) => {
				element.find('.drop-zone').addClass('dragover');
				e.preventDefault();
			});

			element.on('dragleave', () => {
				element.find('.drop-zone').removeClass('dragover');
			});

			element.on('drop', async (e) => {
				element.find('.drop-zone').removeClass('dragover');
				e.preventDefault();
				template.open('entcore/media-library/main', 'entcore/media-library/loading');
				const files = e.originalEvent.dataTransfer.files;
				scope.importFiles(e.originalEvent.dataTransfer.files);
				scope.$apply();
			});

			scope.$watch('ngModel', function(newVal){
				if((newVal && newVal._id) || (newVal && scope.multiple && newVal.length)){
					scope.ngChange();
				}
				scope.upload.documents = [];
			});

			$('body').on('click', '.lightbox-backdrop', function(){
				scope.upload.documents = [];
			});

			template.open('entcore/media-library/main', 'entcore/media-library/browse');
			
			scope.myDocuments = MediaLibrary.myDocuments;

			scope.display = {
				search: '',
				limit: 12
			};

			const previousImage = () => {
				const start = scope.upload.documents.indexOf(scope.display.editedDocument) - 1;
				for(let i = start; i >= 0; i --){
					if(scope.upload.documents[i].isEditableImage){
						return scope.upload.documents[i];
					}
				}
			};

			const nextImage = () => {
				const start = scope.upload.documents.indexOf(scope.display.editedDocument) + 1;
				for(let i = start; i < scope.upload.documents.length; i ++){
					if(scope.upload.documents[i].isEditableImage){
						return scope.upload.documents[i];
					}
				}
			};

			scope.isEditedFirst = () => !previousImage();
			scope.isEditedLast = () => !nextImage();
			scope.nextImage = () => scope.display.editedDocument = nextImage();
			scope.previousImage = () => scope.display.editedDocument = previousImage();

			scope.show = (tab) => {
				template.open('entcore/media-library/main', 'entcore/media-library/' + tab);
				cancelAll();
				scope.upload.loading = [];
				setTimeout(() => {
					scope.upload.highlights.forEach((doc: Document) => {
						element.find('img').each((index, item) => {
							if($(item).attr('src').indexOf(doc._id) !== -1){
								let highlight = $('<div class="highlight"></div>');
								const explorer = $(item).parents('.explorer');
								explorer.append(highlight);
								explorer.scope().ngModel = true;
								explorer.scope().$apply();
							}
						});
					});
					setTimeout(() => {
						$('.highlight').addClass('show');
						setTimeout(() => {
							$('.highlight').removeClass('show');
							setTimeout(() => {
								$('.highlight').remove();
								scope.upload.highlights = [];
							}, 720);
						}, 720);
					}, 30);
				}, 100);
			};

			scope.listFrom = async (listName): Promise<any> => {
				scope.display.listFrom = listName;
				await MediaLibrary[scope.display.listFrom].sync();
			};

			scope.openFolder = async (folder) => {
				if(scope.openedFolder.folder && folder.folder.indexOf(scope.openedFolder.folder + '_') === -1){
					scope.openedFolder.closeFolder();
				}

				scope.openedFolder = folder;
				await folder.sync();
				scope.documents = filteredDocuments(folder);
				scope.folders = folder.folders.all;
				scope.$apply();
			};

			scope.$watch('visibility', function(newVal){
				if(model.me && model.me.workflow.workspace.create){
					if(scope.visibility === 'public'){
						scope.display.listFrom = 'publicDocuments';
					}
					else{
						scope.display.listFrom = 'appDocuments';
					}
				}
				else if(model.me && model.me.workflow.workspace.list){
					scope.display.listFrom = 'sharedDocuments';
				}

				MediaLibrary.eventer.on('sync', function(){
					scope.documents = filteredDocuments(MediaLibrary[scope.display.listFrom]);
					if(MediaLibrary[scope.display.listFrom].folders){
						scope.folders = MediaLibrary[scope.display.listFrom].folders.filter(function(folder){
							return idiom.removeAccents(folder.name.toLowerCase()).indexOf(idiom.removeAccents(scope.display.search.toLowerCase())) !== -1;
						});
						scope.$apply('folders');
					} else {
						delete(scope.folders);
					}

					scope.folder = MediaLibrary[scope.display.listFrom];
					scope.openedFolder = scope.folder;
					scope.$apply('documents');
				});

				scope.$watch('fileFormat', async (newVal) => {
					if(!newVal){
						return;
					}

					if(newVal === 'audio'){
						template.open('entcore/media-library/main', 'entcore/media-library/record');
						element.parents('lightbox').on('lightboxvisible', () => {
							template.open('entcore/media-library/main', 'entcore/media-library/record');
							scope.$apply();
						});
					}
					else{
						template.open('entcore/media-library/main', 'entcore/media-library/browse');
						element.parents('lightbox').on('lightboxvisible', () => {
							template.open('entcore/media-library/main', 'entcore/media-library/browse');
							scope.$apply();
						});
					}
					if(MediaLibrary.foldersStore.length === 0){
						await MediaLibrary.myDocuments.sync();
					}
					if (MediaLibrary[scope.display.listFrom].documents.length === 0) {
						MediaLibrary[scope.display.listFrom].sync();
					}
					else {
						MediaLibrary.eventer.trigger('sync');
					}
				});
			});

			function filteredDocuments(source){
				return source.documents.filter(function(doc){
					return (doc.role() === scope.fileFormat || scope.fileFormat === 'any') &&
						idiom.removeAccents(doc.metadata.filename.toLowerCase()).indexOf(idiom.removeAccents(scope.display.search.toLowerCase())) !== -1;
				});
			}

			scope.insertRecord = async () => {
				await MediaLibrary.appDocuments.sync();
				template.open('entcore/media-library/main', 'entcore/media-library/browse');
				scope.listFrom('appDocuments');
			};

			scope.selectedDocuments = () => scope.documents ? scope.documents.filter(d => d.selected) : [];
			scope.selectDocument = (document: Document) => {
				scope.documents.forEach(d => d.selected = false);
				document.selected = true;
				scope.selectDocuments();
			}
			scope.selectDocuments = async () => {
				const selectedDocuments = scope.selectedDocuments();
				if((scope.folder === MediaLibrary.appDocuments && scope.visibility === 'protected') ||
					(scope.folder === MediaLibrary.publicDocuments && scope.visibility === 'public')){
					if(scope.multiple){
						scope.ngModel = selectedDocuments;
					}
					else{
						scope.ngModel = selectedDocuments[0];
					}
				}
				else{
					const duplicateDocuments = [];
					scope.display.loading = selectedDocuments;
					for(let i = 0; i < selectedDocuments.length; i++){
						let newFile;
						if(scope.visibility === 'public'){
							newFile = await selectedDocuments[i].publicDuplicate();
						}
						else{
							newFile = await selectedDocuments[i].protectedDuplicate();
						}
						duplicateDocuments.push(newFile);
					}

					scope.display.loading = [];
					if(scope.multiple){
						scope.ngModel = duplicateDocuments;
					}
					else{
						scope.ngModel = duplicateDocuments[0];
					}
					scope.$apply();
				}
			};

			scope.updateSelection = (doc) => {
				if(!scope.multiple){
					scope.documents.forEach(d => d.selected = false);
					doc.selected = true;
				}
			}

			const cancelAll = () => {
				scope.display.editedDocument = undefined;
				
				scope.upload.documents.forEach(doc => {
					if(doc.status === DocumentStatus.loaded){
						doc.delete();
					}
					if(doc.status === DocumentStatus.loading){
						doc.abort();
					}
				});
				scope.upload.documents = [];
			}

			scope.abortOrDelete = (doc: Document) => {
				if(doc.status === DocumentStatus.loaded){
					doc.delete();
				}
				if(doc.status === DocumentStatus.loading){
					doc.abort();
				}
				const index = scope.upload.documents.indexOf(doc);
				scope.upload.documents.splice(index, 1);
				if(!scope.upload.documents.length){
					template.open('entcore/media-library/main', 'entcore/media-library/upload');
				}
				if(doc === scope.display.editedDocument){
					scope.display.editedDocument = undefined;
				}
			};

			scope.confirmImport = async () => {
				scope.upload.documents.forEach(doc => {
					doc.applyBlob();
					scope.upload.highlights.push(doc);
				});
				scope.upload.documents = [];
				await scope.listFrom('appDocuments');
				scope.show('browse');
				scope.$apply();
			}

			scope.cancelUpload = () => {
				template.open('entcore/media-library/main', 'entcore/media-library/upload');
				cancelAll();
			};

			scope.importFiles = function(files){
				if(!files){
					files = scope.upload.files;
				}
				for(var i = 0; i < files.length; i++){
					let doc = new Document();
					scope.upload.documents.push(doc);
					doc.upload(files[i], scope.visibility).then(() => scope.$apply());
				}
				scope.upload.files = undefined;
				template.open('entcore/media-library/main', 'entcore/media-library/loading');
			};

			scope.updateSearch = function(){
				scope.documents = filteredDocuments(scope.openedFolder);
			};

			scope.editImage = () => scope.display.editDocument = true;
			
			scope.$on("$destroy", function() {
				cancelAll();
				MediaLibrary.deselectAll();
			});
		}
	}
});