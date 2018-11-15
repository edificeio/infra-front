import { appPrefix } from '../globals';
import { ng } from '../ng-start';
import { $ } from "../libs/jquery/jquery";
import { MediaLibrary, Document, DocumentStatus, Folder } from '../workspace/workspace-v1';
import { template } from '../template';
import { model } from '../modelDefinitions';
import { idiom } from '../idiom';
import http from 'axios';

type LIST_TYPE = "myDocuments" | "appDocuments" | "publicDocuments" | "sharedDocuments" | "trashDocuments";
export interface MediaLibraryScope {
	template: any
	multiple: boolean
	visibility: "public" | "protected"
	display: {
		search: string,
		limit: number,
		editDocument?: boolean,
		listFrom?: LIST_TYPE,
		loading?: Document[],
		compressionReady?: boolean,
		editedDocument?: Document
	}
	upload: {
		files?: FileList
		loading?: Document[],
		documents: Document[],
		highlights: Document[]
	}
	openedFolder: Folder
	myDocuments: Folder
	sharedDocuments: Folder
	documents: Document[]
	folders: Folder[]
	folder: Folder
	fileFormat: string
	updateSearch()
	editImage()
	insertRecord()
	selectedDocuments(): Document[]
	selectDocument(doc: Document)
	selectDocuments();
	openFolder(folder: Folder)
	isListFrom(listName: LIST_TYPE): boolean
	listFrom(listName: string)
	show(tab: string)
	isEditedFirst(): boolean
	isEditedLast(): boolean
	nextImage(): void
	previousImage(): void
	importFiles(files: FileList)
	closeCompression()
	openCompression(doc: Document)
	updateSelection(doc: Document)
	abortOrDelete(doc: Document)
	confirmImport()
	cancelUpload()
	//angular
	ngModel: Document | Document[]
	ngChange()
	$apply(a?)
	$watch(a?, b?)
	$on(a?, b?)
	$parent: any
}
export const mediaLibrary = ng.directive('mediaLibrary', ['$timeout', function ($timeout) {
	return {
		restrict: 'E',
		scope: {
			ngModel: '=',
			ngChange: '&',
			multiple: '=',
			fileFormat: '='
		},
		templateUrl: '/' + appPrefix + '/public/template/entcore/media-library/main.html',
		link: function (scope: MediaLibraryScope, element, attributes) {
			scope.template = template;

			if (!(window as any).toBlobPolyfillLoaded) {
				http.get('/infra/public/js/toBlob-polyfill.js').then((response) => {
					eval(response.data);
					(window as any).toBlobPolyfillLoaded = true;
				});
			}

			scope.$watch(function () {
				return scope.$parent.$eval(attributes.visibility);
			}, function (newVal) {
				scope.visibility = newVal;
				if (!scope.visibility) {
					scope.visibility = 'protected';
				}
				scope.visibility = scope.visibility.toLowerCase() as any;
			});

			scope.openCompression = (doc: Document) => {
				if (!doc.isEditableImage) {
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

			scope.$watch('ngModel', function (newVal) {
				scope.upload.documents = [];
			});

			$('body').on('click', '.lightbox-backdrop', function () {
				scope.upload.documents = [];
			});

			template.open('entcore/media-library/main', 'entcore/media-library/browse');

			scope.myDocuments = MediaLibrary.myDocuments;
			scope.sharedDocuments = MediaLibrary.sharedDocuments;

			scope.display = {
				search: '',
				limit: 24
			};

			const previousImage = () => {
				const start = scope.upload.documents.indexOf(scope.display.editedDocument) - 1;
				for (let i = start; i >= 0; i--) {
					if (scope.upload.documents[i].isEditableImage) {
						return scope.upload.documents[i];
					}
				}
			};

			const nextImage = () => {
				const start = scope.upload.documents.indexOf(scope.display.editedDocument) + 1;
				for (let i = start; i < scope.upload.documents.length; i++) {
					if (scope.upload.documents[i].isEditableImage) {
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
						element.find('explorer').each((index, item) => {
							if ($(item).attr('doc-id').indexOf(doc._id) !== -1) {
								let highlight = $('<div class="highlight"></div>');
								const explorer = $(item).children('.explorer');
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
			scope.isListFrom = function (listName: LIST_TYPE) {
				return scope.display.listFrom == listName;
			}
			scope.listFrom = async (listName: LIST_TYPE): Promise<any> => {
				scope.display.listFrom = listName;
				const temp = MediaLibrary[scope.display.listFrom];
				await scope.openFolder(temp);
			};
			const refresh = function () {
				scope.documents = filteredDocuments(MediaLibrary[scope.display.listFrom]);
				scope.folders = filterFolders(scope.openedFolder);
				scope.$apply();
			}
			MediaLibrary.eventer.on('sync', refresh);
			MediaLibrary.eventer.on('ready', () => {
				scope.folder = MediaLibrary[scope.display.listFrom];
				scope.openedFolder = scope.folder;
				scope.documents = filteredDocuments(MediaLibrary[scope.display.listFrom]);
				scope.folders = filterFolders(scope.openedFolder);
				scope.$apply();
			});
			//init
			MediaLibrary.sync();
			scope.openFolder = async (folder) => {
				scope.openedFolder = folder;
				await folder.sync();
				scope.documents = filteredDocuments(folder);
				scope.folders = filterFolders(scope.openedFolder);
				scope.$apply();
			};

			scope.$watch('visibility', function (newVal) {
				if (model.me && model.me.workflow.workspace.create) {
					if (scope.visibility === 'public') {
						scope.listFrom("publicDocuments")
					}
					else {
						scope.listFrom("appDocuments")
					}
				}
				else if (model.me && model.me.workflow.workspace.list) {
					scope.listFrom("sharedDocuments")
				}
				scope.$watch('fileFormat', async (newVal) => {
					if (!newVal) {
						return;
					}

					if (newVal === 'audio') {
						template.open('entcore/media-library/main', 'entcore/media-library/record');
						element.parents('lightbox').on('lightboxvisible', () => {
							template.open('entcore/media-library/main', 'entcore/media-library/record');
							scope.$apply();
						});
					}
					else {
						template.open('entcore/media-library/main', 'entcore/media-library/browse');
						element.parents('lightbox').on('lightboxvisible', () => {
							template.open('entcore/media-library/main', 'entcore/media-library/browse');
							scope.$apply();
						});
					}
					if (MediaLibrary[scope.display.listFrom].documents.length === 0) {
						MediaLibrary[scope.display.listFrom].sync();
					}
				});
			});
			function matchSearch(str: string) {
				if (scope.display.search && scope.display.search.trim().length > 0) {
					return idiom.removeAccents((str || "").toLowerCase()).indexOf(idiom.removeAccents(scope.display.search.toLowerCase())) !== -1;
				} else {
					return true;
				}
			}
			function filteredDocuments(source: Folder) {
				return source.documents.filter(function (doc: Document) {
					const filetypeOk = (doc.role() === scope.fileFormat || scope.fileFormat === 'any');
					const filenameOk = matchSearch(doc.metadata.filename);
					const nameOk = matchSearch(doc.name);
					return filetypeOk && (filenameOk || nameOk);
				});
			}

			function filterFolders(source: Folder) {
				if (!source || !source.folders) {
					return [];
				}
				return source.folders.filter(function (doc: Folder) {
					return matchSearch(doc.name);
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
				if ((scope.folder === MediaLibrary.appDocuments && scope.visibility === 'protected') ||
					(scope.folder === MediaLibrary.publicDocuments && scope.visibility === 'public')) {
					if (scope.multiple) {
						scope.ngModel = selectedDocuments;
					}
					else {
						scope.ngModel = selectedDocuments[0];
					}
				}
				else {
					const duplicateDocuments = [];
					scope.display.loading = selectedDocuments;
					for (let i = 0; i < selectedDocuments.length; i++) {
						let newFile;
						if (scope.visibility === 'public') {
							newFile = await selectedDocuments[i].publicDuplicate();
						}
						else {
							newFile = await selectedDocuments[i].protectedDuplicate();
						}
						duplicateDocuments.push(newFile);
					}

					scope.display.loading = undefined;
					if (scope.multiple) {
						scope.ngModel = duplicateDocuments;
					}
					else {
						scope.ngModel = duplicateDocuments[0];
					}
					scope.$apply();
				}
				if ((scope.ngModel && (scope.ngModel as Document)._id) || (scope.ngModel && scope.multiple && (scope.ngModel as Document[]).length)) {
					$timeout(() => scope.ngChange());
				}
			};

			scope.updateSelection = (doc) => {
				if (!scope.multiple) {
					scope.documents.forEach(d => d.selected = false);
					doc.selected = true;
				}
			}

			const cancelAll = () => {
				scope.display.editedDocument = undefined;

				scope.upload.documents.forEach(doc => {
					if (doc.uploadStatus === "loaded") {
						doc.delete();
					}
					if (doc.uploadStatus === "loading") {
						doc.abort();
					}
				});
				scope.upload.documents = [];
			}

			scope.abortOrDelete = (doc: Document) => {
				if (doc.uploadStatus === "loaded") {
					doc.delete();
				}
				if (doc.uploadStatus === "loading") {
					doc.abort();
				}
				const index = scope.upload.documents.indexOf(doc);
				scope.upload.documents.splice(index, 1);
				if (!scope.upload.documents.length) {
					template.open('entcore/media-library/main', 'entcore/media-library/upload');
				}
				if (doc === scope.display.editedDocument) {
					scope.display.editedDocument = undefined;
				}
			};

			scope.confirmImport = async () => {
				scope.upload.documents.forEach(doc => {
					doc.applyBlob();
					scope.upload.highlights.push(doc);
				});
				scope.upload.documents = [];
				if (scope.visibility == 'public') {
					await scope.listFrom('publicDocuments');
					const lastIndex = MediaLibrary['publicDocuments'].documents.all.length - 1;
					if (lastIndex > -1) {
						MediaLibrary['publicDocuments'].documents.all[lastIndex].selected = true;
					}
				}
				else
					await scope.listFrom('appDocuments');
				scope.show('browse');
				scope.$apply();
			}

			scope.cancelUpload = () => {
				template.open('entcore/media-library/main', 'entcore/media-library/upload');
				cancelAll();
			};

			scope.importFiles = function (files) {
				if (!files) {
					files = scope.upload.files;
				}
				for (var i = 0; i < files.length; i++) {
					let doc = new Document();
					scope.upload.documents.push(doc);
					doc.upload(files[i], scope.visibility).then(() => scope.$apply());
				}
				scope.upload.files = undefined;
				template.open('entcore/media-library/main', 'entcore/media-library/loading');
			};

			scope.updateSearch = function () {
				scope.documents = filteredDocuments(scope.openedFolder);
				scope.folders = filterFolders(scope.openedFolder);
			};

			scope.editImage = () => scope.display.editDocument = true;

			scope.$on("$destroy", function () {
				cancelAll();
				MediaLibrary.deselectAll();
			});
		}
	}
}]);