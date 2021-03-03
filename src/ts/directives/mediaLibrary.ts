import { appPrefix, deviceType } from '../globals';
import { ng } from '../ng-start';
import { $ } from "../libs/jquery/jquery";
import { MediaLibrary, Document, Folder } from '../workspace/workspace-v1';
import { template } from '../template';
import { model } from '../modelDefinitions';
import { idiom } from '../idiom';
import http from "axios";
import { DocumentsListModel } from '../workspace/model';
import { workspaceService } from '../workspace/services';
export type Header = { template: string, worflowKey: string, i18Key: string, visible: () => boolean, onDisplay?:()=>void };
export type LIST_TYPE = "myDocuments" | "appDocuments" | "publicDocuments" | "sharedDocuments" | "trashDocuments" | "externalDocuments";
export type MediaLibraryView = "icons" | "list";
export interface MediaLibraryDelegate {
	title?:string
	visit?($scope: MediaLibraryScope);
	augmentHeaders?(headers: Header[]): Header[];
	filterDocumentRole?(element: Document): boolean
	handleShow?($scope: MediaLibraryScope, args: { cancelAll: () => void, displayHighLights: () => void, showTemplate: (h: Header) => void }): boolean;
}
export interface MediaLibraryScope {
	template: any
	multiple: boolean
	documentList: DocumentsListModel;
	visibility: "public" | "protected" | "external"
	display: {
		search: string,
		editDocument?: boolean,
		listFrom?: LIST_TYPE,
		loading?: Document[],
		compressionReady?: boolean,
		editedDocument?: Document,
	}
	viewMode: MediaLibraryView
	orderFieldDocument: string
	orderFieldFolder: string
	upload: {
		files?: FileList,
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
	delegate?: MediaLibraryDelegate
	title():string
	updateSearch()
	editImage()
	insertRecord()
	selectedDocuments(): Document[]
	selectDocument(doc: Document)
	selectDocuments();
	openFolder(folder: Folder)
	isViewMode(mode: MediaLibraryView): void
	changeViewMode(mode: MediaLibraryView): void
	orderByField(field: string): void
	orderByDefault(): void
	isOrderedAsc(field: string): boolean
	isOrderedDesc(field: string): boolean
	isListFrom(listName: LIST_TYPE): boolean
	listFrom(listName: LIST_TYPE)
	headers(): Header[];
	showHeader(tab: Header)
	showHeaderByI18Key(tab: string)
	isSelectedHeader(header: Header): boolean;
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
	canExpand(folder:Folder):boolean
	isExternalVisible(): boolean
	triggerIpnutFileClick(event): void;
	//angular
	ngModel: Document | Document[]
	ngChange()
	$apply(a?)
	$watch(a?, b?)
	$on(a?, b?)
	$id: any
	$parent: any
}

export const mediaLibrary = ng.directive('mediaLibrary', ['$timeout','$filter', function ($timeout,$filter) {
	return {
		restrict: 'E',
		scope: {
			delegate: "=",
			ngModel: '=',
			ngChange: '&',
			multiple: '=',
			fileFormat: '='
		},
		templateUrl: '/' + appPrefix + '/public/template/entcore/media-library/main.html',
		link: function (scope: MediaLibraryScope, element, attributes) {
			scope.documentList = new DocumentsListModel($filter, true);
			scope.documentList.watch(scope);
			//=== Call visitors
			scope.delegate && scope.delegate.visit && scope.delegate.visit(scope);
			//
			const MAIN_CONTAINER = 'entcore/media-library/main';
			const TEMPLATE_LOADING = 'entcore/media-library/loading';
			//=== Headers
			const HEADER_BROWSE: Header = {
				i18Key: "library.header.browse",
				template: "entcore/media-library/browse",
				visible: () => true,
				worflowKey: null
			}
			const HEADER_UPLOAD: Header = {
				i18Key: "library.header.upload",
				template: "entcore/media-library/upload",
				visible: () => true,
				worflowKey: "workspace.create"
			}
			const HEADER_RECORD: Header = {
				i18Key: "library.header.record",
				template: "entcore/media-library/record",
				visible: () => scope.fileFormat === 'audio',
				worflowKey: "workspace.create"
			}
			scope.template = template;
			//
			let header: Header = HEADER_BROWSE;
			let hack: boolean = true;
			const showTemplate = (h: Header) => {
				header = h;
				template.open(MAIN_CONTAINER, h.template);
				h.onDisplay && h.onDisplay();
				// This is a horrendous hack to bypass rendering problems with webkit
				if (navigator.userAgent.match(/iPhone/i) && hack) {
					hack = false;
					let display = $("editor").css("display");
					$("editor").css("display", "none");
					setTimeout(() => { hack = true; $("editor").css("display", display); }, 500);
				}
				//
			}
			scope.headers = function () {
				const headers = [HEADER_RECORD, HEADER_UPLOAD, HEADER_BROWSE]
				return scope.delegate && scope.delegate.augmentHeaders ? scope.delegate.augmentHeaders(headers) : headers;
			}
			scope.title = () => {
				if(scope.delegate && scope.delegate.title){
					return scope.delegate.title;
				}else{
					return idiom.translate("medialibrary.title");
				}
			}
			//prefetch screen to avoid lock
			template.open("entcore/media-library/cache", TEMPLATE_LOADING);
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

			scope.canExpand = (folder:Folder) => {
				return folder.canExpand();
			}

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
				template.open(MAIN_CONTAINER, TEMPLATE_LOADING);
				const files = e.originalEvent.dataTransfer.files;
				scope.importFiles(e.originalEvent.dataTransfer.files);
			});

			scope.$watch('ngModel', function (newVal) {
				scope.upload.documents = [];
			});

			$('body').on('click', '.lightbox-backdrop', function () {
				scope.upload.documents = [];
			});

			showTemplate(HEADER_BROWSE);

			scope.myDocuments = MediaLibrary.myDocuments;
			scope.sharedDocuments = MediaLibrary.sharedDocuments;

			scope.display = {
				search: ''
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
			const displayHighLights = () => {
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
			}
			//
			scope.showHeaderByI18Key = function (key: string) {
				const tab = scope.headers().find(h => h.i18Key == key);
				tab && scope.showHeader(tab);
			}
			scope.showHeader = function (tab: Header) {
				if (scope.delegate && scope.delegate.handleShow) {
					const hasHandled = scope.delegate.handleShow(scope, { cancelAll, displayHighLights, showTemplate });
					if (hasHandled) return;
				}
				showTemplate(tab);
				cancelAll();
				displayHighLights();
			}
			scope.isExternalVisible = function () {
				return scope.visibility == "external";
			}
			scope.isSelectedHeader = function (h: Header): boolean {
				return header && h && header.i18Key == h.i18Key;
			}
			scope.isViewMode = function (mode: MediaLibraryView) {
					return scope.viewMode == mode;
			}
			scope.changeViewMode = function (mode: MediaLibraryView) {
					if (!mode || scope.viewMode == mode) {
							return;
					}
					template.open('documents-view', "entcore/media-library/" + mode);
					scope.viewMode = mode;
					workspaceService.savePreference({bbmView: mode})
			}
			workspaceService.getPreference().then(pref=>{
				scope.changeViewMode(pref.bbmView as MediaLibraryView || "icons");
			})
			scope.orderByField = function(field: string): void
			{
				if(scope.isOrderedAsc(field) == true)
					scope.orderFieldDocument = '-' + field;
				else if(scope.isOrderedDesc(field))
					return scope.orderByDefault();
				else
					scope.orderFieldDocument = field;

				scope.orderFieldFolder = scope.orderFieldDocument;
			}
			scope.orderByDefault = function(): void
			{
				scope.orderFieldDocument = "-created";
				scope.orderFieldFolder = "name";
			}
			scope.orderByDefault();
			scope.isOrderedAsc = function(field: string): boolean
			{
				return scope.orderFieldDocument == field;
			}
			scope.isOrderedDesc = function(field: string): boolean
			{
				return scope.orderFieldDocument == '-' + field;
			}
			scope.isListFrom = function (listName: LIST_TYPE) {
				return scope.display.listFrom == listName;
			}
			scope.listFrom = async (listName: LIST_TYPE): Promise<any> => {
				console.log('LIST FROM')
				scope.display.listFrom = listName;
				const temp = MediaLibrary[scope.display.listFrom];
				await scope.openFolder(temp);
			};
			const refresh = function () {
				scope.documents = filteredDocuments(MediaLibrary[scope.display.listFrom]);
				scope.folders = filterFolders(scope.openedFolder);
			}
			MediaLibrary.eventer.on('sync', refresh);
			MediaLibrary.eventer.on('ready', () => {
				scope.folder = MediaLibrary[scope.display.listFrom];
				scope.openedFolder = scope.folder;
				scope.documents = filteredDocuments(MediaLibrary[scope.display.listFrom]);
				scope.folders = filterFolders(scope.openedFolder);
			});
			//init
			MediaLibrary.sync();
			scope.openFolder = async (folder) => {
				scope.openedFolder = folder;
				await folder.sync();
				scope.documents = filteredDocuments(folder);
				scope.folders = filterFolders(scope.openedFolder);
			};

			scope.$watch('visibility', function (newVal) {
				if (scope.visibility == "external") {
					scope.listFrom("externalDocuments")
				} else if (model.me && model.me.workflow.workspace.create) {
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
						showTemplate(HEADER_RECORD);
						element.parents('lightbox').on('lightboxvisible', () => {
							showTemplate(HEADER_RECORD);
						});
					}
					else {
						showTemplate(HEADER_BROWSE);
						element.parents('lightbox').on('lightboxvisible', () => {
							showTemplate(HEADER_BROWSE);
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
					const hasDelegateRoleFilter = scope.delegate && scope.delegate.filterDocumentRole;
					const hasValidRole = (doc.role() === scope.fileFormat || scope.fileFormat === 'any');
					const filetypeOk = hasDelegateRoleFilter ? scope.delegate.filterDocumentRole(doc) : hasValidRole;
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
				showTemplate(HEADER_BROWSE);
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
				if (scope.visibility === 'external' ||
					(scope.openedFolder.filter == "protected" && scope.visibility === 'protected') ||
					(scope.openedFolder.filter == "public" && scope.visibility === 'public')) {
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
				scope.upload.loading = [];
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
					showTemplate(HEADER_UPLOAD);
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
				scope.showHeader(HEADER_BROWSE);
			}

			scope.cancelUpload = () => {
				showTemplate(HEADER_UPLOAD);
				cancelAll();
			};

			scope.importFiles = function (files) {
				if (!files) {
					files = scope.upload.files;
				}
				for (var i = 0; i < files.length; i++) {
					let doc = new Document();
					scope.upload.documents.push(doc);
					const visibility = scope.visibility == "external" ? "protected" : scope.visibility;
					doc.upload(files[i], visibility).then(() => scope.$apply());
				}
				scope.upload.files = undefined;
				template.open(MAIN_CONTAINER, TEMPLATE_LOADING);
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

			// Rather dirty hack in case event isn't propagated from button to input..
			scope.triggerIpnutFileClick = function(event) {
				event.preventDefault();
				event.stopPropagation();
				$(".upload-input").trigger("click", [scope.$id]);
			}
			element.on('click', '.upload-input', (event, scopeId) => {
				if (scopeId != scope.$id) {
					event.preventDefault();
				}
				event.stopPropagation();
			});
		}
	}
}]);
