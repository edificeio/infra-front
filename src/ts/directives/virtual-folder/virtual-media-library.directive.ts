import {Directive, ng} from "../../ng-start";
import {IScope} from "angular";
import {appPrefix} from "../../globals";
import {httpPromisy as http} from "../../http";
import {Behaviours} from "../../behaviours";
import {FolderTreeProps} from "../folderTree";
import {Tree} from "../../workspace/model";
import {Document, workspace} from "../../workspace";
import models = workspace.v2.models;
import {idiom as lang, idiom} from "../../idiom";
import {IVirtualMediaLibraryScope} from "./virtual-media-library.model";

interface IVirtualMediaLibrary {
    apps: Array<string>;
    folderServiceTree: FolderTreeProps;
    openedFolder: Array<models.Element>;
    selectedFolder: models.Element;
    selectedFolderService: Tree;
    mediaServiceLibrary: IVirtualMediaLibraryScope;

    safeApply(): void;
    triggerClick(mediaService: IVirtualMediaLibraryScope): void;
}

class Controller implements ng.IController, IVirtualMediaLibrary {
    public apps: Array<string>;
    public folderServiceTree: FolderTreeProps;
    public openedFolder: Array<models.Element>;
    public selectedFolder: models.Element;
    public selectedFolderService: Tree;
    public mediaServiceLibrary: IVirtualMediaLibraryScope;

    constructor(private $scope: IScope) {
        this.apps = [];
        this.openedFolder = [];
        this.folderServiceTree = null;
        this.selectedFolderService = null;
        this.mediaServiceLibrary = null;
    }

    async $onInit() {
        await this.loadBehavioursModules();
        this.initServiceTree();
        this.safeApply();
    }

    async loadBehavioursModules(): Promise<void[]> {
        const conf: any = await http().get('/workspace/conf/public');
        this.apps = conf && conf['folder-service'] ? conf['folder-service'] : [];
        const promises: Promise<void>[] = [];
        this.apps.forEach((app: string) => {
            if (appPrefix !== app) {
                promises.push(idiom.addBundlePromise(`/${app}/i18n`));
                promises.push(Behaviours.load(app));
            }
        });
        return Promise.all(promises);
    }

    initServiceTree(): void {
        let foldersServices: Array<Tree> = [];

        this.apps.forEach((app: string) => {
            if (Behaviours.applicationsBehaviours[app].mediaLibraryService &&
                Behaviours.applicationsBehaviours[app].mediaLibraryService.enableInitFolderTree()) {
                let folderService: Tree = {name: lang.translate(`${app}.virtual.media.title`), children: [], hierarchical: true};
                (<any>folderService).app = app;
                foldersServices.push(folderService);
            }
        });

        const virtualMedia: IVirtualMediaLibrary = this;
        this.folderServiceTree = {
            get trees(): any | Array<Tree> {
                return foldersServices;
            },
            isDisabled(folder: models.Element): boolean {
                return false;
            },
            isOpenedFolder(folder: models.Element): boolean {
                return virtualMedia.openedFolder.some((openFolder: models.Element) => openFolder === folder);
            },
            isSelectedFolder(folder: models.Element): boolean {
                return virtualMedia.selectedFolder === folder;
            },
            async openFolder(folder: models.Element): Promise<void> {
                virtualMedia.selectedFolder = folder;
                if (!virtualMedia.openedFolder.some((openFolder: models.Element) => openFolder === folder)) {
                    virtualMedia.openedFolder.push(folder);
                }
                if ((<Tree>folder).hierarchical) {
                    virtualMedia.mediaServiceLibrary = Behaviours.applicationsBehaviours[(<any>virtualMedia.selectedFolder).app].mediaLibraryService;
                    try {
                        await virtualMedia.mediaServiceLibrary.initFolderTree();
                        foldersServices
                            .filter((folderService: Tree) => folderService.name !== folder.name && (<Tree>folder).hierarchical)
                            .forEach((folderService: Tree) => folderService.children = []);
                        // find current service
                        let currentFolderService: Tree = foldersServices.find((folderService: Tree) =>
                            folderService.name === folder.name && (<Tree>folder).hierarchical);
                        if (currentFolderService) {
                            virtualMedia.selectedFolderService = currentFolderService;
                            currentFolderService.children = (<any>virtualMedia).mediaServiceLibrary.folders;
                        }
                        virtualMedia.mediaServiceLibrary.openedTree = this;
                        virtualMedia.triggerClick(virtualMedia.mediaServiceLibrary);
                        virtualMedia.safeApply();
                    } catch (e) {
                        const message: string = "Error while initializing folderService: ";
                        console.error(message + (e.message || e));
                    }
                } else {
                    try {
                        await virtualMedia.mediaServiceLibrary.openFolder(<Document>folder);
                        if (virtualMedia.selectedFolder.children) {
                            (<any>virtualMedia).selectedFolder.children = virtualMedia.mediaServiceLibrary.folders;
                        }
                        virtualMedia.safeApply();
                    } catch (err) {
                        const message: string = "Error while opening folderFolder: ";
                        console.error(message + (err.message || err));
                    }
                }
            },
        };
    }

    triggerClick(mediaService: IVirtualMediaLibraryScope): void {
        this.$scope.$eval(this.$scope['vm']['onClick']());
        this.$scope['vm']['selectedVirtualFolder'] = mediaService;
    }

    safeApply(): void {
        let phase: any = this.$scope.$root.$$phase;
        if (phase !== '$apply' && phase !== '$digest') {
            this.$scope.$apply();
        }
    }
}

function directive() {
    return {
        restrict: 'E',
        templateUrl:  '/' + appPrefix + '/public/template/entcore/media-library/virtual-media-library/virtual-media-folder.html',
        scope: {
            selectedVirtualFolder: "=",
            onClick: "&"
        },
        controllerAs: 'vm',
        bindToController: true,
        controller: ['$scope', Controller],
        link: function (scope: ng.IScope,
                        element: ng.IAugmentedJQuery,
                        attrs: ng.IAttributes,
                        vm: ng.IController) {

            // reset virtual data on switch list from media-library
            scope.$parent.$watch('display.listFrom', (value) => {
                if (value != null) {
                    vm.openedFolder = [];
                    vm.selectedFolder = null;
                    scope['vm'].selectedVirtualFolder = null;
                    scope['vm'].mediaServiceLibrary = null;
                }
            });
        }
    }
}
export const virtualMediaLibrary: Directive = ng.directive('virtualMediaLibrary', directive);