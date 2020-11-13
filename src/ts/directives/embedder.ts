import {ng} from '../ng-start';
import {appPrefix, devices, deviceType} from '../globals';
import {http} from '../http';
import {$} from '../libs/jquery/jquery';
import {Header, LIST_TYPE, MediaLibraryScope, MediaLibraryView} from "./mediaLibrary";
import {template} from "../template";
import {Document, Folder, MediaLibrary} from "../workspace";
import {idiom} from "../idiom";
import {model} from "../modelDefinitions";
import { embedderService } from '../embedder';
import { Me } from '../me';
import { DocumentsListModel } from '../workspace/model';

export interface VideoDelegate {
    title?: string
    filterDocumentRole?(element: Document): boolean

    visit?($scope: VideoScope);

    augmentHeaders?(headers: Header[]): Header[];

    handleShow?($scope: MediaLibraryScope, args: { cancelAll: () => void, displayHighLights: () => void, showTemplate: (h: Header) => void }): boolean;

}

export interface VideoScope {
    template: any;
    show: boolean;
    delegate?: VideoDelegate;
    display: {
        search: string,
        limit: number,
        loading?: Document[],
        url?: String,
        invalidPath?: boolean,

        provider?: { name?: String, embed?: any, url?: Array<String> },
        compressionReady?: boolean,
        editDocument?: boolean,
        editedDocument?: Document,
        listFrom?: LIST_TYPE,
        htmlCode?: any
    },
    documentList: DocumentsListModel;
    orderFieldDocument: string
    orderFieldFolder: string
    folders: Folder[]
    openedFolder: Folder
    folder: Folder
    multiple: boolean
    fileFormat: string

    myDocuments: Folder;
    sharedDocuments: Folder;
    documents: Document[];
    providers?: Array<any>,
    upload: {
        files?: FileList,
        loading?: Document[],
        documents: Document[],
        highlights: Document[]
    };
    visibility: "public" | "protected" | "external";
    viewMode: MediaLibraryView

    updatePreview():void;
    applyHtml():void;
    unselectProvider():void;
    title(): string
    updateSearch():void
    editImage():void
    insertRecord(docId: string):void
    selectedDocuments(): Document[]
    selectDocument(doc: Document)
    selectDocuments():void;
    openFolder(folder: Folder):void
    isViewMode(mode: MediaLibraryView): void
    changeViewMode(mode: MediaLibraryView): void
    orderByField(field: string): void
    orderByDefault(): void
    isOrderedAsc(field: string): boolean
    isOrderedDesc(field: string): boolean
    isListFrom(listName: LIST_TYPE): boolean
    listFrom(listName: LIST_TYPE):void
    headers(): Header[];
    showHeader(tab: Header):void
    showHeaderByI18Key(tab: string):void
    isSelectedHeader(header: Header): boolean;
    isEditedFirst(): boolean
    isEditedLast(): boolean
    nextImage(): void
    previousImage(): void
    importFiles(files: FileList):void
    closeCompression():void
    openCompression(doc: Document):void
    updateSelection(doc: Document):void
    abortOrDelete(doc: Document):void
    confirmImport():void
    cancelUpload():void
    isExternalVisible(): boolean
    //angular
    ngModel: string
    ngChange():void
    $apply(a?:any):void
    $watch(a?:any, b?:any):void
    $on(a?:any, b?:any):void
    $parent: any
    cancel():void;
    $broadcast:any;
}

export let embedder = ng.directive('embedder', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        restrict: 'E',
        scope: {
            delegate: "=",
            ngModel: '=',
            ngChange: '&',
            fileFormat: '=',
            show: '=',
            hiddenShareVideoCode: '='
        },
        templateUrl: '/' + appPrefix + '/public/template/entcore/video/main.html',
        link: function (scope: VideoScope, element, attributes) {
			scope.documentList = new DocumentsListModel($filter, true);
			scope.documentList.watch(scope);
            //console.log('scope.delegate link', scope)
            scope.delegate && scope.delegate.visit && scope.delegate.visit(scope);
            scope.display = {
                search: '',
                limit: 24,
                provider: {
                    name: 'none'
                }
            };
            scope.upload = {
                documents: [],
                highlights: []
            };
            scope.providers = [];

            const MAIN_CONTAINER = 'entcore/video/main';
            const TEMPLATE_LOADING = 'entcore/media-library/loading';

            //=== Headers
            const HEADER_INTEGRATION: Header = {
                i18Key: "video.header.integration",
                template: "entcore/video/integration",
                visible: () => true,
                worflowKey: null
            };
            const HEADER_BROWSE: Header = {
                i18Key: "library.header.browse",
                template: "entcore/media-library/browse",
                visible: () => true,
                worflowKey: "video.view"
            };
            const HEADER_UPLOAD: Header = {
                i18Key: "video.header.upload",
                template: "entcore/media-library/upload",
                visible: () => false,
                worflowKey: "workspace.create"
            }
            const HEADER_RECORD: Header = {
                i18Key: "video.header.record",
                template: "entcore/video/record",
                onDisplay(){
                    emitDisplayEvent();
                },
                visible: () => true,
                worflowKey: "video.view"
            };
            Me.hasWorkflowRight("video.view") //hack to start and load workflow rights
            const emitDisplayEvent = () =>{
                console.log("Broadcast display event displayVideoRecorder...")
                scope.$broadcast('displayVideoRecorder', {});
            }
            scope.template = template;
            //
            let header: Header = HEADER_BROWSE;

            const showTemplate = async (h: Header) => {
                header = h;
                await template.open(MAIN_CONTAINER, h.template);
                h.onDisplay && setTimeout(()=>{
                    h.onDisplay();
                })
            };

            scope.headers = function () {
                const headers = [HEADER_INTEGRATION, HEADER_RECORD, HEADER_UPLOAD, HEADER_BROWSE]
                return scope.delegate && scope.delegate.augmentHeaders ? scope.delegate.augmentHeaders(headers) : headers;
            };

            scope.isSelectedHeader = function (h: Header): boolean {
                return header && h && header.i18Key == h.i18Key;
            }

            scope.$on("video-upload", function (event, docId) {
                //console.log('TEMPLATE LOADING ')
                //template.open(MAIN_CONTAINER, TEMPLATE_LOADING);
                scope.insertRecord(docId);
            });

            scope.title = () => {
                //console.log('scope.delegate title', scope.delegate)

                if (scope.delegate && scope.delegate.title) {
                    return scope.delegate.title;
                } else {
                    return idiom.translate("video.embedder.title");
                }
            }

            //prefetch screen to avoid lock
            template.open("entcore/media-library/cache", TEMPLATE_LOADING);
            if (!(window as any).toBlobPolyfillLoaded) {
                http().get('/infra/public/js/toBlob-polyfill.js').done((response) => {
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
                scope.$apply();
            });

            scope.$watch('ngModel', function (newVal) {
                scope.upload.documents = [];
            });

            $('body').on('click', '.lightbox-backdrop', function () {
                scope.upload.documents = [];
            });
            showTemplate(HEADER_INTEGRATION);


            scope.myDocuments = MediaLibrary.myDocuments;
            scope.sharedDocuments = MediaLibrary.sharedDocuments;


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
                //console.log('scope.delegate showHeader', scope.delegate)
                if (scope.delegate && scope.delegate.handleShow) {
                    //TODO why cast as any?
                    const hasHandled = scope.delegate.handleShow(scope as any, {cancelAll, displayHighLights, showTemplate});
                    if (hasHandled) return;
                }
                showTemplate(tab);
                cancelAll();
                displayHighLights();
            }
            scope.isExternalVisible = function () {
                return scope.visibility == "external";
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
            }
            scope.changeViewMode("icons");
            scope.orderByField = function (field: string): void {
                if (scope.isOrderedAsc(field) == true)
                    scope.orderFieldDocument = '-' + field;
                else if (scope.isOrderedDesc(field))
                    return scope.orderByDefault();
                else
                    scope.orderFieldDocument = field;

                scope.orderFieldFolder = scope.orderFieldDocument;
            }
            scope.orderByDefault = function (): void {
                scope.orderFieldDocument = "-created";
                scope.orderFieldFolder = "name";
            }
            scope.orderByDefault();
            scope.isOrderedAsc = function (field: string): boolean {
                return scope.orderFieldDocument == field;
            }
            scope.isOrderedDesc = function (field: string): boolean {
                return scope.orderFieldDocument == '-' + field;
            }
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
                //console.log(scope.documents);
                scope.folders = filterFolders(scope.openedFolder);
                scope.$apply();
            };

            scope.$watch('visibility', function (newVal) {
                if (scope.visibility == "external") {
                    scope.listFrom("externalDocuments")
                } else if (model.me && model.me.workflow.workspace.create) {
                    if (scope.visibility === 'public') {
                        scope.listFrom("publicDocuments")
                    } else {
                        scope.listFrom("appDocuments")
                    }
                } else if (model.me && model.me.workflow.workspace.list) {
                    scope.listFrom("sharedDocuments")
                }
                scope.$watch('fileFormat', async (newVal) => {
                    //console.log('FILEFORMAT', newVal);
                    if (!newVal) {
                        return;
                    }

                    if (newVal === 'video') {
                        showTemplate(HEADER_INTEGRATION);
                        element.parents('lightbox').on('lightboxvisible', () => {
                            showTemplate(HEADER_INTEGRATION);
                            scope.$apply();
                        });
                    } else {
                        showTemplate(HEADER_BROWSE);
                        element.parents('lightbox').on('lightboxvisible', () => {
                            showTemplate(HEADER_BROWSE);
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
                    const hasDelegateRoleFilter = scope.delegate && scope.delegate.filterDocumentRole;
                    //console.log('scope.delegate', scope.delegate)
                    //console.log('hasDelegateRoleFilter', hasDelegateRoleFilter)
                    //console.log('hasDelegateRoleFilter', hasDelegateRoleFilter)
                    const hasValidRole = (doc.role() === scope.fileFormat || scope.fileFormat === 'any');
                    //console.log('hasValidRole', hasValidRole)
                    const filetypeOk = hasDelegateRoleFilter ? scope.delegate.filterDocumentRole(doc) : hasValidRole;
                    //console.log('filetypeOk', filetypeOk)
                    const filenameOk = matchSearch(doc.metadata.filename);
                    //console.log('filenameOk', filenameOk)
                    const nameOk = matchSearch(doc.name);
                    //console.log('nameOk', nameOk)
                    //console.log('----------------------------')
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
            
            function logVideoEvent(eventName: string, document: Document) {
                if (document.metadata.captation) {
                    let browserInfo = devices.getBrowserInfo();
                    let videoEventData = {
                        event: eventName,
                        videoId: document._id,
                        userId: model.me.userId,
                        userProfile: model.me.profiles[0],
                        device: deviceType,
                        browser: browserInfo.name + ' ' + browserInfo.version,
                        structure: model.me.structureNames[0],
                        level: model.me.level,
                        videoDuration: document.metadata.duration,
                        videoSize: document.metadata.size,
                        url: window.location.hostname,
                        app: appPrefix
                    }
                    http().postJson('/infra/video/event', videoEventData).done(function(res){
                        console.log(res);
                    });
                }
            }
            
            scope.insertRecord = async (docId: string) => {
                await MediaLibrary.appDocuments.sync();
                MediaLibrary['appDocuments'].documents.all.forEach(doc => {
                    if (doc.file == docId) {
                        scope.upload.highlights.push(doc);
                    }
                });
                scope.showHeader(HEADER_BROWSE);
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
                        scope.ngModel = embedderService.getHtmlForVideoStreams(selectedDocuments);
                    } else {
                        scope.ngModel = embedderService.getHtmlForVideoStream(selectedDocuments[0]);
                    }
                } else {
                    const duplicateDocuments = [];
                    scope.display.loading = selectedDocuments;
                    for (let i = 0; i < selectedDocuments.length; i++) {
                        let newFile;
                        if (scope.visibility === 'public') {
                            newFile = await selectedDocuments[i].publicDuplicate();
                        } else {
                            newFile = await selectedDocuments[i].protectedDuplicate();
                        }
                        duplicateDocuments.push(newFile);
                    }

                    scope.display.loading = undefined;
                    if (scope.multiple) {
                        scope.ngModel = embedderService.getHtmlForVideoStreams(duplicateDocuments);
                    } else {
                        scope.ngModel =  embedderService.getHtmlForVideoStream(duplicateDocuments[0]);
                    }
                    scope.$apply();
                }
                if (scope.ngModel) {
                    setTimeout(() => {
                        scope.ngChange && scope.ngChange();
                        selectedDocuments.forEach(selectedDocument => logVideoEvent('EVENT_VIDEO_ADD', selectedDocument));
                    });
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
                } else
                    await scope.listFrom('appDocuments');
                scope.showHeader(HEADER_BROWSE);
                scope.$apply();
            }

            scope.cancelUpload = () => {
                showTemplate(HEADER_UPLOAD);
                cancelAll();
            };

            scope.importFiles = function (files) {
                //console.log('IMPORT FILES', files);
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

            //////

            element.on('focus', 'textarea', (e) => {
                $(e.target).next().addClass('focus');
                $(e.target).next().addClass('move');
                $(e.target).prev().addClass('focus');
            });

            element.on('blur', 'textarea', (e) => {
                if (!$(e.target).val()) {
                    $(e.target).next().removeClass('move');
                }
                $(e.target).next().removeClass('focus');
                $(e.target).prev().removeClass('focus');
            });

            scope.$watch('show', function (newValue) {
                scope.unselectProvider();
            });

            http().get('/infra/embed/default').done(function (providers) {
                providers.forEach(function (provider: any) {
                    scope.providers.push(provider);
                });
            });

            http().get('/infra/embed/custom').done(function (providers) {
                providers.forEach(function (provider) {
                    provider.name = provider.name.toLowerCase().replace(/\ |\:|\?|#|%|\$|£|\^|\*|€|°|\(|\)|\[|\]|§|'|"|&|ç|ù|`|=|\+|<|@/g, '')
                    scope.providers.push(provider);
                });
            });

            scope.applyHtml = function () {
                scope.show = false;
                scope.ngModel = scope.display.htmlCode;
                scope.$apply();
                scope.ngChange && scope.ngChange();
                scope.unselectProvider();
            };

            scope.cancel = function () {
                scope.show = false;
                template.close(MAIN_CONTAINER);
                scope.unselectProvider();
                scope.$broadcast('releaseVideo', {});
            };

            scope.unselectProvider = function () {
                let preview = element.find('.' + scope.display.provider.name + ' .preview');
                preview.html('');
                scope.display.provider = {name: 'none'};
                scope.display.url = '';
                scope.display.htmlCode = '';
                scope.display.invalidPath = false;
            };

            scope.$watch(
                function () {
                    return scope.display.htmlCode;
                },
                function (newVal) {
                    setTimeout(function () {
                        scope.updatePreview();
                    }, 20);
                }
            );

            scope.$watch(
                function () {
                    return scope.display.url;
                },
                function (newVal) {
                    setTimeout(function () {
                        scope.updatePreview();
                    }, 20);
                }
            );

            scope.updatePreview = function () {

                if(scope.display.provider.name === 'other'){
                    let preview = element.find('.' + scope.display.provider.name + ' .preview');
                    preview.html(
                        scope.display.htmlCode
                    );
                    return;
                }
                if (!scope.display.url) {
                    return;
                }

                label:for (let pattern of scope.display.provider.url) {

                    let matchParams = new RegExp('\{[a-zA-Z0-9_.]+\}', "g");
                    let params = pattern.match(matchParams);
                    let computedEmbed = scope.display.provider.embed;

                    for(let param of params) {

                        scope.display.invalidPath = false;

                        let paramBefore = pattern.split(param)[0];
                        let additionalSplit = paramBefore.split('}')

                        if (additionalSplit.length > 1) {
                            paramBefore = additionalSplit[additionalSplit.length - 1];
                        }

                        let paramAfter = pattern.split(param)[1].split('{')[0];
                        let paramValue = scope.display.url.split(paramBefore)[1];

                        if (!paramValue && param !== "{ignore}") {
                            scope.display.invalidPath = true;
                            continue label;
                        }
                        if (paramAfter) {
                            paramValue = paramValue.split(paramAfter)[0];
                        }

                        let replace = new RegExp('\\' + param.replace(/}/, '\\}'), 'g');

                        computedEmbed = computedEmbed.replace(replace, paramValue);
                        scope.display.htmlCode = computedEmbed;

                        if(param === params[params.length - 1]) {
                            break label;
                        }
                    };
                };

                let preview = element.find('.' + scope.display.provider.name + ' .preview');
                preview.html(
                    scope.display.htmlCode
                );


            };
        }

    }
}]);
