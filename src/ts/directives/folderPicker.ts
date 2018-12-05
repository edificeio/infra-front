import { ng } from '../ng-start';
import { FolderTreeProps } from './folderTree';

import { workspace, Document } from "../workspace";

import models = workspace.v2.models;
import { idiom } from '../idiom';
const workspaceService = workspace.v2.service;

export interface FolderPickerScope {
    treeProps: FolderTreeProps
    folderProps: FolderPickerProps
    trees: models.Tree[]
    newFolder: models.Element
    search: {
        value: string
    }
    safeApply(a?)
    //
    isStateNormal(): boolean
    isStateLoading(): boolean
    isStateLoaded(): boolean
    //
    openEditView()
    canOpenEditView(): boolean
    isEditVew(): boolean
    submitNewFolder()
    //
    canResetSearch()
    resetSearch()
    searchKeyUp(event)
    //
    onCancel()
    onSubmit()
    cannotSubmit(): boolean
}
export interface FolderPickerSource {
    action: "create-from-blob" | "copy-from-file" | "move-from-file"
}
export interface FolderPickerSourceFile extends FolderPickerSource {
    fileId: string
}
export interface FolderPickerSourceBlob extends FolderPickerSource {
    title?: string
    content: Blob
}
export interface FolderPickerProps {
    i18: {
        title: string
        actionTitle: string
        actionProcessing: string
        actionFinished: string
        info: string
    }
    sources: FolderPickerSource[]
    treeProvider?(): Promise<models.Tree[]>
    manageSubmit?(folder: models.Element): boolean;
    submit?(folder: models.Element);
    onCancel()
    onSubmitSuccess(dest: models.Element, count: number)
}
export const folderPicker = ng.directive('folderPicker', ['$timeout', ($timeout) => {
    return {
        restrict: 'E',
        scope: {
            folderProps: '='
        },
        template: `
        <div class="horizontal-spacing-twice">
            <h2 translate content="[[folderProps.i18.title]]"></h2>
            <div ng-if="isStateNormal()">
                <div class="row" ng-if="folderProps.i18.info">
                    <div class="info" translate content="[[folderProps.i18.info]]"></div>
                </div>
                <div class="row">
                    <div class="search-pagination ">
                        <a ng-class="{'show-close':canResetSearch()}" ng-show="canResetSearch()" ng-click="resetSearch()"><i class="close horizontal-spacing cell-ellipsis"></i></a>
                        <input ng-class="{'eleven':canResetSearch(),'twelve':!canResetSearch()}" type="text" ng-model="search.value" ng-keyup="searchKeyUp($event)"
                            i18n-placeholder="search">
                        <i class="search"></i>
                    </div>
                </div>
                <div class="row top-spacing-twice">
                    <folder-tree tree-props="treeProps"></folder-tree>
                    <hr />
                </div>
                <a ng-if="canOpenEditView()" ng-click="openEditView()" class="twelve cell vertical-spacing"><i18n>folderpicker.folder.edit</i18n></a>
                <div class="row vertical-spacing input-block" ng-if="isEditVew()">
                    <div class="six flex-row">
                        <input type="text" required ng-model="newFolder.name" class="flex-one" />
                        <button ng-click="submitNewFolder()" ng-disabled="!newFolder.name" translate content="create" class="left-spacing-twice"></button>
                    </div>
                </div>
                <div class="lightbox-buttons fluid">
                    <button class="right-magnet" ng-disabled="cannotSubmit()" ng-click="onSubmit()" translate content="[[folderProps.i18.actionTitle]]"></button>
                    <button class="cancel right-magnet" ng-click="onCancel()"><i18n>cancel</i18n></button>
                </div>
            </div>
            <div ng-if="isStateLoading()">
                <div class="flex-row vertical-spacing-four">
                    <div class="centered vertical-spacing-four">
                        <div class="vertical-spacing-four primary-color">
                            <h2 translate content="[[folderProps.i18.actionProcessing]]"></h2><i class="spinner left-spacing"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div ng-if="isStateLoaded()">
                <div class="flex-row vertical-spacing-four">
                    <div class="centered vertical-spacing-four">
                        <div class="vertical-spacing-four valid-color">
                            <h2 translate content="[[folderProps.i18.actionFinished]]" class="valid-color"></h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `,
        link: async (scope: FolderPickerScope, element, attributes) => {
            scope.search = { value: "" };
            scope.newFolder = models.emptyFolder();
            //
            scope.safeApply = function (fn) {
                const phase = this.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
            //INIT TREES
            if (scope.folderProps.treeProvider) {
                scope.trees = await scope.folderProps.treeProvider();
            } else {
                const trees = await workspaceService.fetchTrees({
                    filter: "all",
                    hierarchical: true
                });
                scope.trees = []
                for (let tree of trees) {
                    switch (tree.filter) {
                        case "owner":
                            scope.trees[0] = tree;
                            tree.name = idiom.translate("workspace.myDocuments");
                            break
                        case "shared":
                            scope.trees[1] = tree;
                            tree.name = idiom.translate("workspace.sharedDocuments");
                            break
                        case "protected":
                            scope.trees[2] = tree;
                            tree.name = idiom.translate("workspace.appDocuments");
                            break
                        case "public":
                            scope.trees[3] = tree;
                            tree.name = idiom.translate("workspace.publicDocuments");
                            break
                    }
                }
            }
            const canSelect = function (folder: models.Element) {
                if ((folder as models.Tree).filter) {
                    //can write only on root owner
                    return (folder as models.Tree).filter == "owner";
                } else {
                    const fileIds = getSourceFileIds();
                    return folder.canCopyFileIdsInto(fileIds);
                }
            }
            //FILTER TREES
            const original = scope.trees = scope.trees.filter(t => t.filter == "owner" || t.filter == "shared")
            //
            const matchFolder = function (folder: models.Element) {
                if (!scope.search.value || scope.search.value.trim().length == 0) {
                    return true;
                }
                const search = scope.search.value.toLowerCase();
                const totest = folder.name ? folder.name.toLowerCase() : "";
                return totest.startsWith(search);
            }
            const filterSubtree = function (subTrees: models.Element[]) {
                const subTreesMatching = []
                for (let subTree of subTrees) {
                    const recursive = filterSubtree(subTree.children || []);
                    if (recursive.length || matchFolder(subTree)) {
                        const copy = new models.Element
                        Object.assign(copy, subTree);
                        copy.children = recursive;
                        subTreesMatching.push(copy)
                    }
                }
                return subTreesMatching;
            }
            const startSearch = function () {
                if (scope.search.value && scope.search.value.trim().length > 0) {
                    const trees = []
                    for (let tree of scope.trees) {
                        const copy = { ...tree };
                        copy.children = filterSubtree(tree.children);
                        trees.push(copy)
                    }
                    scope.trees = trees;
                } else {
                    scope.trees = original;
                }
                scope.safeApply();
            }
            //
            let selectedFolder: models.Element = null;
            let openedFolder: models.Element = null;
            scope.treeProps = {
                cssTree: "maxheight-half-vh",
                get trees() {
                    return scope.trees;
                },
                isDisabled(folder) {
                    return !canSelect(folder)
                },
                isOpenedFolder(folder) {
                    if (openedFolder === folder) {
                        return true;
                    } else if ((folder as models.Tree).filter) {
                        return true;
                    }
                    return openedFolder && workspaceService.findFolderInTreeByRefOrId(folder, openedFolder);
                },
                isSelectedFolder(folder) {
                    return selectedFolder === folder;
                },
                openFolder(folder) {
                    if (canSelect(folder)) {
                        openedFolder = selectedFolder = folder;
                    } else {
                        openedFolder = folder;
                    }
                }
            }
            //
            scope.canResetSearch = function () {
                return scope.search.value && scope.search.value.trim().length > 0
            }
            scope.resetSearch = function () {
                scope.search.value = "";
                startSearch();
            }
            scope.searchKeyUp = function () {
                startSearch();
            }
            //
            let editing = false;
            scope.openEditView = function () {
                scope.newFolder = models.emptyFolder();
                editing = true;
            }
            scope.canOpenEditView = function () {
                return !!selectedFolder && !editing;
            }
            scope.isEditVew = function () {
                return editing;
            }
            scope.submitNewFolder = async function () {
                const created = await workspaceService.createFolder(scope.newFolder, selectedFolder);
                editing = false;
                if (created instanceof models.Element) {
                    selectedFolder.children.push(created)
                    selectedFolder = scope.newFolder;
                }
                scope.newFolder = models.emptyFolder();
                scope.safeApply();
            }
            //state
            let state: "normal" | "loading" | "loaded" = "normal"
            scope.isStateNormal = function () {
                return state == "normal";
            }
            scope.isStateLoading = function () {
                return state == "loading";
            }
            scope.isStateLoaded = function () {
                return state == "loaded";
            }
            const setState = function (n: "normal" | "loading" | "loaded") {
                state = n;
                scope.safeApply()
            }
            //
            scope.onCancel = function () {
                scope.folderProps.onCancel()
                setState("normal");
            }
            scope.cannotSubmit = function () {
                return !selectedFolder;
            }
            const getSourceFileIds = function () {
                const copyFromFiles: FolderPickerSourceFile[] = scope.folderProps.sources.filter(f => f.action == "copy-from-file") as any;
                const moveFromFiles: FolderPickerSourceFile[] = scope.folderProps.sources.filter(f => f.action == "move-from-file") as any;
                let copyIds = copyFromFiles.map(c => c.fileId);
                let moveIds = moveFromFiles.map(c => c.fileId);
                return copyIds.concat(moveIds);
            }
            scope.onSubmit = async function () {
                if (scope.folderProps.manageSubmit //
                    && scope.folderProps.manageSubmit(selectedFolder) //
                    && scope.folderProps.submit) {
                    scope.folderProps.submit(selectedFolder)
                    return;
                }
                //
                setState("loading")
                //
                const count = scope.folderProps.sources.length;
                const copyFromFiles: FolderPickerSourceFile[] = scope.folderProps.sources.filter(f => f.action == "copy-from-file") as any;
                const moveFromFiles: FolderPickerSourceFile[] = scope.folderProps.sources.filter(f => f.action == "move-from-file") as any;
                const createFromBlob: FolderPickerSourceBlob[] = scope.folderProps.sources.filter(f => f.action == "create-from-blob") as any;
                //
                if (copyFromFiles.length) {
                    const ids = copyFromFiles.map(c => c.fileId);
                    await workspaceService.copyAllFromIds(ids, selectedFolder)
                }
                //
                if (moveFromFiles.length) {
                    const ids = moveFromFiles.map(c => c.fileId);
                    await workspaceService.moveAllFromIds(ids, selectedFolder)
                }
                //
                if (createFromBlob.length) {
                    const promises = createFromBlob.map(blob => {
                        const c = new Document()
                        if (blob.title) {
                            c.name = blob.title
                        }
                        return workspaceService.createDocument(blob.content, c, selectedFolder)
                    })
                    await Promise.all(promises)
                }
                //
                setState("loaded")
                $timeout(() => {
                    setState("normal")
                    scope.folderProps.onSubmitSuccess(selectedFolder, count);
                }, 1000)
            }
            //
            scope.safeApply();
        }
    }
}])