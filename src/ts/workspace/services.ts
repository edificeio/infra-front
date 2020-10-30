import { model } from '../modelDefinitions';
import { http as httpOriginal, httpPromisy as http, PromiseHttp } from '../http';
import { idiom as lang, idiom } from '../idiom';
import { notify } from '../notify';
import { Document, MediaLibrary } from './workspace-v1';
import * as workspaceModel from './model';
import { Subject } from 'rxjs';
//=============DOCUMENTS FUNCTIONS===================================================
const acceptDocuments =  (params:ElementQuery) => (current: workspaceModel.Node) => {
    //filter by trasherid
    const currentElement = current as workspaceModel.Element;
    if (currentElement.deleted && currentElement.trasher) {
        return model.me.userId == currentElement.trasher;
    }
    //in case of directShared document => hide doc that are visible inside a folder
    if(params.directShared && currentElement.eParent){
        const isParentVisible = workspaceService._cacheFolders.find(folder => folder._id == currentElement.eParent);
        if(isParentVisible){
            return false;
        }
    }
    return true;
}
const mapDocuments = (f:workspaceModel.Node) => {
    const ff = new Document(f);
    //load behaviours and myRights
    const res = ff.behaviours("workspace");
    //load rights
    if (res instanceof Promise) {
        res.then(_ => ff.rights && ff.rights.fromBehaviours())
    } else {
        ff.rights && ff.rights.fromBehaviours();
    }
    return ff;
}
//====================FOLDER FUNCTIONS===================
const mapFolder = (f:workspaceModel.Element) => {
    const ff = new workspaceModel.Element(f);
    //load behaviours and myRights
    const res = ff.behaviours("workspace");
    //load rights
    if (res instanceof Promise) {
        res.then(_ => ff.rights && ff.rights.fromBehaviours())
    } else {
        ff.rights && ff.rights.fromBehaviours();
    }
    workspaceService.isLazyMode()?ff.cacheChildren.reset():ff.cacheChildren.disableCache();
    workspaceService.isLazyMode()?ff.cacheDocument.reset():ff.cacheDocument.disableCache();
    return ff;
}
const filterByTrasher = function (current: workspaceModel.Node) {
    const currentElement = current as workspaceModel.Element;
    if (currentElement.deleted && currentElement.trasher) {
        return model.me.userId == currentElement.trasher;
    }
    return true;
}
const filterSharedFolders = (el:workspaceModel.Element) => el.isShared && !el.deleted;
const filterTrashedFolders = (el:workspaceModel.Element) => el.deleted;
const filterProtectedFolders = (el:workspaceModel.Element) => el.protected;
const filterPublicFolders = (el:workspaceModel.Element) => el.public;
const filterOtherFolders = (el:workspaceModel.Element) => {
    if(filterSharedFolders(el)) return false;
    if(filterTrashedFolders(el)) return false;
    if(filterProtectedFolders(el)) return false;
    if(filterPublicFolders(el)) return false;
    return true;
}
const filterFoldersByTreeName = (tree:workspaceModel.TREE_NAME, parent:workspaceModel.Element) =>{
    if(!tree || tree == "all"){
        if(parent){
            if(filterSharedFolders(parent)) tree = "shared";
            else if(filterTrashedFolders(parent)) tree = "trash";
            else if(filterProtectedFolders(parent)) tree = "protected";
            else if(filterPublicFolders(parent)) tree = "public";
            else if(filterOtherFolders(parent)) tree = "owner";
            else tree = "all";
        }else{
            tree = "all";
        }
    }
    switch(tree){
        case "all":
            return (_)=>true;
        case "external":
            return (_) => false;
        case "owner":
            return filterOtherFolders;
        case "protected":
            return filterProtectedFolders;
        case "public":
            return filterPublicFolders;
        case "shared":
            return filterSharedFolders;
        case "trash":
            return filterTrashedFolders;
    }
}
//======================ELEMENTS FUNCTIONS
const sortElement = (sort: "name" | "created")=>{
    let sorts = workspaceModel.sortByCreatedAsc();
    switch (sort) {
        case "created":
            sorts = workspaceModel.sortByCreatedAsc();
            break;
        case "name":
            sorts = workspaceModel.sortByNameAsc();
            break;
    }
    return sorts;
}
//========================INTERFACE
export interface ElementQuery {
    id?: string;
    parentId?: string
    hierarchical?: boolean
    filter: workspaceModel.TREE_NAME,
    search?: string
    includeall?: boolean
    ancestorId?: string
    application?: string
    directShared?: boolean
    limit?: number;
    skip?: number;
    onlyRoot?:boolean
}

export interface WorkspaceEvent {
    action: "add" | "update" | "document-change" | "tree-change" | "delete" | "empty"
    treeSource?: workspaceModel.TREE_NAME
    treeDest?: workspaceModel.TREE_NAME
    dest?: workspaceModel.Element
    elements?: workspaceModel.Element[]
    ids?: string[]
}

export type ElementWithVisible = workspaceModel.Element & {
    visibleGroups:Array<{id:string, name:string,structureName:string, groupDisplayName:string}>
    visibleUsers:Array<{id:string, username:string,lastName:string, firstName:string, login:string, profile:string}>
}

let MAX_FILE_SIZE;
let xsrfCookie: { name: string, val: string };
if (document.cookie) {
    let cookies = document.cookie.split(';').map((c) => {
        return {
            name: c.split('=')[0].trim(),
            val: c.split('=')[1].trim()
        };
    });
    xsrfCookie = cookies.find(c => c.name == 'XSRF-TOKEN');
}

let preferences: WorkspacePreference = null;
const preferencesDefault: WorkspacePreference = { view: "icons", quickstart: "notviewed" }
export interface WorkspacePreference {
    sortField?: string
    sortDesc?: boolean
    view?: WorkspacePreferenceView
    bbmView?: WorkspacePreferenceView
    quickstart?: "viewed" | "notviewed"
}
export type DocumentActionType = "comment" | "download" | "move" | "copy" | "share" | "history"
export type DocumentFilter = (element: workspaceModel.Element, query: ElementQuery) => boolean
export type DocumentActionFilter = (element: workspaceModel.Element, type:DocumentActionType) => boolean
export type FullScreenRenderer = (element: workspaceModel.Element) => { close() } | false
export type WorkspacePreferenceView = "list" | "icons" | "carousel";
export const workspaceService = {
    _externalFullScreen: [] as FullScreenRenderer[],
    _externalActionFilter: [] as DocumentActionFilter[],
    _externalDocumentFilters: [] as DocumentFilter[],
    _externalFolders: [] as Promise<workspaceModel.Element | null>[],
    _cacheFolders: [] as workspaceModel.Element[],
    onChange: new Subject<WorkspaceEvent>(),
    onImportFiles: new Subject<FileList>(),
    onConfirmImport: new Subject<workspaceModel.Element[]>(),
    isLazyMode():boolean{
        return (window as any).LAZY_MODE;
    },
    hasExternalFolders(){
        return workspaceService._externalFolders.length>0;
    },
    async getExternalFolders(){
        const folders = await Promise.all(workspaceService._externalFolders);
        return folders.filter(f=>f!=null);
    },
    async getExternalFolderFor({externalId}:{externalId:string}){
        const folders = await workspaceService.getExternalFolders();
        const find = folders.find(f=>f.externalId==externalId);
        return {
            exists: !!find,
            folder:find
        }
    },
    addExternalFolder(infoPromise: Promise<{ externalId: string, name: string }|null>) {
        const promise = infoPromise.then(info=>{
            //create external folder if not exists
            if(info == null){
                return null;
            }
            const extFolder = workspaceModel.Element.createExternalFolder(info);
            return workspaceService.createFolder(extFolder);
        }).then(folder =>{
            //cast result
            if(folder!=null && folder instanceof workspaceModel.Element){
                return folder;
            }
            return null;
        });
        workspaceService._externalFolders.push(promise);
        workspaceService.onChange.next({
            action: "tree-change",
            treeDest: "external"
        })
    },
    registerExternalDocumentFilter(filter: DocumentFilter) {
        workspaceService._externalDocumentFilters.push(filter);
    },
    registerExternalActionFilter(filter: DocumentActionFilter) {
        workspaceService._externalActionFilter.push(filter);
    },
    registerExternalFullScreenRenderer(renderer: FullScreenRenderer) {
        workspaceService._externalFullScreen.push(renderer);
    },
    renderFullScreen(element: workspaceModel.Element) {
        for (let rend of workspaceService._externalFullScreen) {
            const res = rend(element);
            if(res!=false){
                return res;
            }
        }
        return false;
    },
    isActionAvailable(type:DocumentActionType,elts:workspaceModel.Element[]){
        for(let elt of elts){
            for(let filter of workspaceService._externalActionFilter){
                if(filter(elt,type)===false){
                    return false;
                }
            }
        }
        return true;
    },
    async getPreference(): Promise<WorkspacePreference> {
        if (preferences) {
            return preferences;
        }
        try {
            const temp: any = await http().get("/userbook/preference/workspace");
            preferences = JSON.parse(temp.preference) || {};
        } catch (e) {
            preferences = {};
        }
        preferences = { ...preferencesDefault, ...preferences };
        return preferences;
    },
    async savePreference(pref: WorkspacePreference) {
        const previous = await workspaceService.getPreference();
        const current = { ...previous, ...pref };
        await http().putJson("/userbook/preference/workspace", current);
        preferences = current;
        return preferences;
    },
    fetchFolders(params: ElementQuery, sort: "name" | "created" = "name"): Promise<workspaceModel.Element[]> {
        return http<workspaceModel.Element[]>().get('/workspace/folders/list', params)
    },
    fetchParentInfo(id: string): Promise<ElementWithVisible> {
        return http<ElementWithVisible>().get(`/workspace/document/parent/${id}`);
    },
    async fetchTrees(params: ElementQuery, sort: "name" | "created" = "name"): Promise<workspaceModel.Tree[]> {
        if(workspaceService.isLazyMode()){
            const trees = <Array<workspaceModel.Tree>>[
                new workspaceModel.ElementTree(true, {children:[], name:"owner", filter:"owner"}),
                new workspaceModel.ElementTree(true, {children:[], name:"shared", filter:"shared"}),
                new workspaceModel.ElementTree(true, {children:[], name:"protected", filter:"protected"}),
                new workspaceModel.ElementTree(true, {children:[], name:"public", filter:"public"}),
                new workspaceModel.ElementTree(true, {children:[], name:"trash", filter:"trash"}),
            ];
            if (workspaceService.hasExternalFolders()) {
                trees.push(new workspaceModel.ElementTree(true, {children:[], name:"external", filter:"external"}));
            }
            return trees;
        }
        let folders: workspaceModel.Element[] = await http<workspaceModel.Element[]>().get('/workspace/folders/list', params);
        //skip external folders
        folders = folders.filter(f=>!f.externalId);
        //cache folders
        workspaceService._cacheFolders = folders;
        //create models
        folders = folders.map(mapFolder);
        //sorts
        const sorts = sortElement(sort);
        //build tree
        const buildTree = (treeName: workspaceModel.TREE_NAME, filter: (el: workspaceModel.Element) => boolean) => {
            let children = folders.filter(filter);
            //remove from folders
            folders = folders.filter(e => !filter(e));
            //build parent child relations from ids
            for (let folder of children) {
                folder.children = children.filter(child => child.eParent == folder._id);
                folder.children = folder.children.sort(sorts)
            }
            //roots does not have parent
            const roots = children.filter(child => {
                if (!child.eParent) {
                    return true;
                }
                return children.filter(c => c._id == child.eParent).length == 0;
            }).sort(sorts)
            //
            return {
                filter: treeName,
                children: roots
            } as workspaceModel.Tree;
        }
        const trees: workspaceModel.Tree[] = [];
        //
        trees.push(buildTree("shared", filterSharedFolders))
        trees.push(buildTree("trash", filterTrashedFolders))
        trees.push(buildTree("protected", filterProtectedFolders));
        trees.push(buildTree("owner", _ => true));//all others
        //add external folders if exists
        if (workspaceService.hasExternalFolders()) {
            const children = await workspaceService.getExternalFolders();
            trees.push({
                filter: "external",
                children
            } as workspaceModel.Tree);
        }
        // filter by trasher
        const tree = trees.find(tree => tree.filter == "trash");
        if (tree) {
            const iterator = function (cursor: workspaceModel.Node) {
                const current = cursor as workspaceModel.Element;
                if (current.children) {
                    for (let child of current.children) {
                        iterator(child);
                    }
                    current.children = current.children.filter(filterByTrasher);
                }
            }
            iterator(tree)
        }
        return trees;
    },
    async fetchDocuments(params: ElementQuery, sort: "name" | "created" = "name", args:{directlyShared:boolean} = {directlyShared:false}): Promise<Document[]> {
        let filesO: workspaceModel.Element[] = [];
        const skip = params.filter == "external" && !params.parentId;
        if(args){
            if(args.directlyShared){
                params.directShared = true;
            }
        }
        if (!skip) {
            filesO = await http<workspaceModel.Element[]>().get('/workspace/documents', params);
        }
        filesO = filesO.filter(acceptDocuments(params));
        //create models
        let files = filesO.map(mapDocuments);
        const sorts = sortElement(sort);
        return files.sort(sorts)
    },
    async fetchChildren(parent:workspaceModel.Element, params: ElementQuery, sort: "name" | "created" = "name", args:{directlyShared?:boolean, onlyFolders?:boolean, onlyDocument?:boolean} = {directlyShared:false, onlyFolders:false, onlyDocument:false}): Promise<Document[]> {
        //skip external folder
        const skip = params.filter == "external" && !params.parentId;
        if (skip) {
            return  [];
        }
        //compute which to load
        const onlyDocument = args && args.onlyDocument;
        const onlyFolders = args && args.onlyFolders;
        const shouldLoadFolders = !onlyDocument && parent.cacheChildren.isEmpty;
        const shouldLoadDocuments = !onlyFolders && parent.cacheDocument.isEmpty
        //prepare params
        if(!(parent instanceof workspaceModel.ElementTree)) params.parentId = parent._id;
        if(args && args.directlyShared){
            params.directShared = true;
        }
        params.hierarchical = false;
        //transformer
        const sorts = sortElement(sort || "name");
        const folderTransformer = async (promise:Promise<workspaceModel.Element[]>) => {
            const fetchedResults = await promise;
            const folders = fetchedResults.filter(n=>n.eType==workspaceModel.FOLDER_TYPE).map(mapFolder)
                                        .filter(filterFoldersByTreeName(params.filter, parent)).filter(filterByTrasher).sort(sorts);
            return folders;
        }
        const documentTransformer = async (promise:Promise<workspaceModel.Element[]>)=>{
            const fetchedResults = await promise;
            const documents = fetchedResults.filter(n=>n.eType==workspaceModel.FILE_TYPE).map(mapDocuments)
                                            .filter(acceptDocuments(params)).filter(filterByTrasher).sort(sorts);
            return documents;
        }
        //fetch
        if(shouldLoadFolders && shouldLoadDocuments){
            params.includeall = true;
            const promise = http<workspaceModel.Element[]>().get('/workspace/documents', params);
            await parent.cacheChildren.setAsyncData(folderTransformer(promise))
            await parent.cacheDocument.setAsyncData(documentTransformer(promise));
            return documentTransformer(promise);
        }else if(shouldLoadDocuments){
            params.includeall = false;
            const promise = http<workspaceModel.Element[]>().get('/workspace/documents', params);
            await parent.cacheDocument.setAsyncData(documentTransformer(promise));
            return documentTransformer(promise);
        }else if(shouldLoadFolders){
            const promise = http<workspaceModel.Element[]>().get('/workspace/folders/list', params);
            await parent.cacheChildren.setAsyncData(folderTransformer(promise))
            return parent.cacheDocument.data;
        }else{
            return parent? parent.cacheDocument.data : [];
        }
    },
    async fetchChildrenForRoot(tree:workspaceModel.ElementTree, params: ElementQuery, sort: "name" | "created" = "name", args:{directlyShared?:boolean, onlyFolders?:boolean, onlyDocument?:boolean} = {directlyShared:false, onlyFolders:false, onlyDocument:false}): Promise<Document[]> {
        if(tree.filter == "shared" && !args.directlyShared){
            args.directlyShared = true;
        }
        return workspaceService.fetchChildren(tree, params, sort, args);
    },
    async fetchFolderById(id:string): Promise<workspaceModel.Element> {
        const params : ElementQuery  = {filter:"all", id};
        const fetchedResults = await http<workspaceModel.Element[]>().get('/workspace/folders/list', params);
        return fetchedResults.length? fetchedResults.map(mapFolder)[0]:null;
               
    },
    countChildren(folder: workspaceModel.Element) {
        if (!folder || !folder.children) {
            return 0;
        }
        return folder.children.length;
    },
    totalFilesSize(fileList: FileList) {
        //calcul la taille d'un ensemble de fichier
        var size = 0
        if (!fileList)
            return size
        for (var i = 0; i < fileList.length; i++) {
            size += fileList[i].size
        }
        return size
    },
    isFile(el: workspaceModel.Element) {
        return el.eType === workspaceModel.FILE_TYPE;
    },
    isFolder(el: workspaceModel.Element) {
        return el.eType === workspaceModel.FOLDER_TYPE;
    },
    isInFoldersRecursively(folder: workspaceModel.Element, roots: workspaceModel.Node[]) {
        const isInFolder = function (target) {
            if (folder === target) {
                return true;
            }
            if (!target.children) {
                return false;
            }
            let result = false;
            target.children.forEach(function (child) {
                result = result || isInFolder(child)
            })
        }
        //
        let result = false;
        roots.forEach(function (targetFolder) {
            result = result || isInFolder(targetFolder);
        });
        return result;
    },
    restoreAll(elements: workspaceModel.Element[]): Promise<any> {
        const ids = elements.map(el => el._id);
        const res = ids.length == 0 ? Promise.resolve(null) : http().putJson(`/workspace/documents/restore`, { ids })
        return res.then(e => {
            workspaceService.onChange.next({ action: "tree-change", elements, treeSource: "trash" });
        });
    },
    removeAllFromList(toRemove: workspaceModel.Element[], list: workspaceModel.Element[]) {
        if (!list || !toRemove) {
            return list;
        }
        const toRemoveIds = toRemove.map(e => e._id);
        return list.filter(e => toRemoveIds.indexOf(e._id) == -1)
    },
    removeFromTree(tree: workspaceModel.Node, matching: (el: workspaceModel.Node) => boolean): void {
        const iterator = function (cursor: workspaceModel.Node) {
            const current = cursor as workspaceModel.Element;
            if (current.children) {
                for (let child of current.children) {
                    iterator(child);
                }
                current.removeChild(matching)
            }
        }
        iterator(tree)
    },
    trashAll(elements: workspaceModel.Element[]): Promise<any> {
        const ids = elements.map(el => el._id);
        const res = ids.length == 0 ? Promise.resolve(null) : http().putJson(`/workspace/documents/trash`, { ids })
        return res.then(e => {
            workspaceService.onChange.next({ action: "tree-change", elements, treeDest: "trash" });
        });
    },
    emptyTrash() {
        return http().delete('/workspace/trash').then(e => {
            workspaceService.onChange.next({ action: "empty", treeSource: "trash" });
        });
    },
    rename(el: workspaceModel.Element, newNameOrigin: string): Promise<any> {
        const extension = el.metadata && el.metadata.extension;
        let newName = newNameOrigin;
        if (extension && newName.indexOf(extension) === -1) {
            newName += '.' + extension;
        }
        let res = null;
        if (workspaceService.isFile(el)) {
            res = http().putJson("/workspace/rename/" + el._id, { name: newName });
        } else {
            res = http().putJson("/workspace/folder/rename/" + el._id, { name: newName });
        }
        res.then(e => {
            workspaceService.onChange.next({ action: "update", elements: [{ name: newNameOrigin, eType: el.eType, _id: el._id } as workspaceModel.Element] });
        });
        res.e400 && res.e400((e)=>{
            const error = JSON.parse(e.responseText).error;
            if(error && error.indexOf("duplicate")){
                notify.error(idiom.translate(error));
            }
        });
        return res;
    },
    deleteAll(elements: workspaceModel.Element[]): Promise<{ nbFiles: number, nbFolders: number }> {
        const ids = elements.map(e => e._id);
        const documents = elements.filter(el => workspaceService.isFile(el))
        const folders = elements.filter(el => workspaceService.isFolder(el))
        const res: PromiseHttp<any> = ids.length == 0 ? Promise.resolve(null) as any : http().deleteJson(`/workspace/documents`, { ids })
        return res.then(e => {
            workspaceService.onChange.next({ action: "delete", elements });
        }).then(e => Promise.resolve({ nbFiles: documents.length, nbFolders: folders.length }))
    },
    elementEqualsByRefOrId(el1: workspaceModel.Node, el2: workspaceModel.Node) {
        return el1 === el2 || (el1 && el2 && el1._id && el1._id == el2._id);
    },
    async sendComment(document: workspaceModel.Element): Promise<workspaceModel.Comment> {
        //file or folder
        const url = workspaceService.isFile(document) ? `/workspace/document/${document._id}/comment` : `/workspace/folder/${document._id}/comment`;
        const res = await http<{ id: string }>().post(url, 'comment=' + encodeURIComponent(document.comment))
        return {
            id: res.id,
            author: model.me.userId,
            authorName: model.me.username,
            comment: document.comment,
            posted: undefined
        }
    },
    removeComment(document: workspaceModel.Element, comment: workspaceModel.Comment): Promise<any> {
        return http().delete('document/' + document._id + '/comment/' + comment.id)
    },
    //Given a data size in bytes, returns a more "user friendly" representation.
    getAppropriateDataUnit(bytes: number) {
        let order = 0
        const orders = {
            0: lang.translate("byte"),
            1: "Ko",
            2: "Mo",
            3: "Go",
            4: "To"
        }
        let finalNb = bytes
        while (finalNb >= 1024 && order < 4) {
            finalNb = finalNb / 1024
            order++
        }
        return {
            nb: finalNb,
            order: orders[order]
        }
    },
    formatDocumentSize(size: number) {
        const formattedData = workspaceService.getAppropriateDataUnit(size)
        return (Math.round(formattedData.nb * 10) / 10) + " " + formattedData.order
    },
    findFolderInTrees(trees: workspaceModel.Node[], folderId: string): workspaceModel.Element {
        for (let t of trees) {
            const founded = workspaceService.findFolderInTree(t, folderId)
            if (founded) {
                return founded;
            }
        }
        return undefined;
    },
    updateInTree(trees: workspaceModel.ElementTree[], model:workspaceModel.Element): workspaceModel.Element {
        for (let t of trees) {
            const founded = workspaceService.findParentFolderInTree(t, model._id)
            if(founded){
                if(founded.parent){
                    founded.parent.updateChild(model);
                }else{
                    founded.child.updateSelf(model);
                }
                return founded.child;
            }
        }
        return undefined;
    },
    findParentFolderInTree(tree: workspaceModel.ElementTree, folderId: string): {parent:workspaceModel.Element,child:workspaceModel.Element} {
        const iterator = function (cursor: workspaceModel.Element, parent: workspaceModel.Element) {
            const current = cursor as workspaceModel.Element;
            if (current._id == folderId && workspaceService.isFolder(current)) {
                return {parent, child:current};
            }
            if (current.children) {
                for (let child of current.children) {
                    const founded = iterator(child, current);
                    if (founded) {
                        return founded;
                    }
                }
            }
            return undefined;
        }
        return iterator(tree, null)
    },
    findFolderInTree(tree: workspaceModel.Node, folderId: string): workspaceModel.Element {
        const iterator = function (cursor: workspaceModel.Node) {
            const current = cursor as workspaceModel.Element;
            if (current._id == folderId && workspaceService.isFolder(current)) {
                return current;
            }
            if (current.children) {
                for (let child of current.children) {
                    const founded = iterator(child);
                    if (founded) {
                        return founded;
                    }
                }
            }
            return undefined;
        }
        return iterator(tree)
    },
    findFolderInTreeByRefOrId(container: workspaceModel.Node, child: workspaceModel.Node, listener?: (founded) => void): boolean {
        const iterator = function (currentFolder: workspaceModel.Node): boolean {
            if (child === currentFolder || (child._id && child._id == currentFolder._id)) {
                listener && listener(currentFolder)
                return true;
            }
            if (currentFolder && currentFolder.children) {
                for (let i = 0; i < currentFolder.children.length; i++) {
                    if (iterator(currentFolder.children[i])) {
                        return true;
                    }
                }
            }
            return false;
        };

        return iterator(container);
    },
    findElementInListByRefOrId(list: workspaceModel.Node[], child: workspaceModel.Node, listener?: (founded) => void): boolean {
        for (let i = 0; i < list.length; i++) {
            const current = list[i];
            if (child === current || (child._id && child._id == current._id)) {
                listener && listener(child)
                return true;
            }
        }
        return false;
    },
    folderToString(tree: workspaceModel.Node, folder: workspaceModel.Element) {
        const childString = function (cursor: workspaceModel.Node) {
            let result = cursor.name;

            if (!cursor.children) {
                return result;
            }

            for (let i = 0; i < cursor.children.length; i++) {
                if (workspaceService.findFolderInTreeByRefOrId(cursor.children[i], folder)) {
                    result = result + '_' + childString(cursor.children[i])
                }
            }

            return result;
        }

        return childString(tree).split("_").filter(path => path != tree.name).join("_");
    },
    downloadFiles(els: workspaceModel.Element[], includeDeleted:boolean=false) {
        const ids = els.map(d => d._id).join(",");
        window.open(`/workspace/document/archive/${ids}?${includeDeleted?"deleted=true":""}`)
    },
    moveAll(els: workspaceModel.Element[], dest: workspaceModel.Element): Promise<{ nbFiles: number, nbFolders: number }> {
        const ids = els.map(e => e._id);
        const documents = els.filter(el => workspaceService.isFile(el))
        const folders = els.filter(el => workspaceService.isFolder(el))
        const res: PromiseHttp<any> = ids.length == 0 ? Promise.resolve(null) as any : http().putJson(`/workspace/documents/move/${dest._id || "root"}`, { ids })
        res.e400 && res.e400(e => {
            const error = JSON.parse(e.responseText);
            notify.error(error.error)
        })
        return res.then(e => {
            workspaceService.onChange.next({ action: "tree-change", elements: els, dest })
        }).then(t => Promise.resolve({ nbFiles: documents.length, nbFolders: folders.length }));
    },
    async moveAllForShared(els: workspaceModel.Element[], dest: workspaceModel.Element): Promise<{ nbFiles: number, nbFolders: number }> {
        const res = await workspaceService.copyAll(els, dest, false)
        await workspaceService.deleteAll(els);
        workspaceService.onChange.next({ action: "tree-change", elements: res.copies, dest })
        return res;
    },
    moveAllFromIds(ids: string[], dest: workspaceModel.Element): Promise<{ nbFiles: number, nbFolders: number }> {
        const res: PromiseHttp<any> = ids.length == 0 ? Promise.resolve(null) as any : http().putJson(`/workspace/documents/move/${dest._id || "root"}`, { ids })
        res.e400 && res.e400(e => {
            const error = JSON.parse(e.responseText);
            notify.error(error.error)
        })
        return res.then(e => {
            workspaceService.onChange.next({ action: "tree-change", ids, dest })
        }).then(t => Promise.resolve({ nbFiles: ids.length, nbFolders: 0 }));
    },
    copyAll(els: workspaceModel.Element[], dest: workspaceModel.Element, sendEvent = true): Promise<{ copies: workspaceModel.Element[], nbFiles: number, nbFolders: number }> {
        const ids = els.map(e => e._id);
        const documents = els.filter(el => workspaceService.isFile(el))
        const folders = els.filter(el => workspaceService.isFolder(el))
        const res = ids.length == 0 ? Promise.resolve(null) : http().postJson(`/workspace/documents/copy/${dest._id || "root"}`, { ids })
        res.catch(e => {
            if (e.responseText) {
                const error = JSON.parse(e.responseText);
                let errText = lang.translate(error.error);
                if (errText != error.error) {
                    notify.error(errText);
                }
            }
        })
        return res.then(results => {
            const copies = results.map(r => {
                const copy = new workspaceModel.Element(r);
                copy.fromMe();//make behaviours working
                //load behaviours and myRights
                copy.behaviours("workspace");
                if (dest && dest.isShared) {
                    copy._isShared = true;
                }
                return copy;
            });
            sendEvent && workspaceService.onChange.next({ action: "tree-change", elements: copies, dest })
            return Promise.resolve(copies);
        }).then(copies => Promise.resolve({ nbFiles: documents.length, nbFolders: folders.length, copies }));
    },
    copyAllFromIds(ids: string[], dest: workspaceModel.Element): Promise<{ copies: workspaceModel.Element[], nbFiles: number, nbFolders: number }> {
        const res = ids.length == 0 ? Promise.resolve(null) : http().postJson(`/workspace/documents/copy/${dest._id || "root"}`, { ids })
        res.catch(e => {
            if (e.responseText) {
                const error = JSON.parse(e.responseText);
                let errText = lang.translate(error.error);
                if (errText != error.error) {
                    notify.error(errText);
                }
            }
        })
        return res.then(results => {
            const copies = results.map(r => {
                const copy = new workspaceModel.Element(r);
                copy.fromMe();//make behaviours working
                //load behaviours and myRights
                copy.behaviours("workspace");
                if (dest && dest.isShared) {
                    copy._isShared = true;
                }
                return copy;
            });
            workspaceService.onChange.next({ action: "tree-change", elements: copies, dest })
            return Promise.resolve(copies);
        }).then(copies => Promise.resolve({ nbFiles: 0, nbFolders: ids.length, copies }));
    },
    notifyContrib(folderId: string, eltsOrIds: workspaceModel.Element[] | string[], addVersion: boolean = false) {
        const getIds = () => {
            const ids: string[] = [];
            for (let e of eltsOrIds) {
                if (e instanceof workspaceModel.Element) {
                    ids.push(e._id);
                } else {
                    ids.push(e);
                }
            }
            return ids;
        }
        if (folderId) {
            const ids: string[] = getIds();
            return http().postJson("/workspace/folder/notify/contrib/" + folderId, { ids, addVersion })
        } else if (addVersion) {
            // when adding version to root => should notify about file change
            const ids: string[] = getIds();
            return http().postJson("/workspace/folder/notify/contrib/root", { ids, addVersion })
        } else {
            return Promise.resolve();
        }
    },
    async createExternalDocument(file: File | Blob, document: Document, externalId:string, params?: { visibility?: "public" | "protected", application?: string }): Promise<Document> {
        const parent = await workspaceService.getExternalFolderFor({externalId});
        if(!parent.exists){
            notify.error(lang.translate("worksapce.external.folder.notfound"))
            console.warn("[WorkspaceService] Could not found external folder: ", externalId, workspaceService, workspaceService._externalFolders)
            return;
        }
        return workspaceService.createDocument(file,document,parent.folder,params);
    },
    async createDocument(file: File | Blob, document: Document, parent?: workspaceModel.Element, params?: { visibility?: "public" | "protected", application?: string }): Promise<Document> {
        document.eType = workspaceModel.FILE_TYPE;
        document.eParent = parent ? parent._id : null;
        document.uploadStatus = "loading";
        document.fromFile(file);
        //
        const fullname = document.metadata.extension ? document.name + "." + document.metadata.extension : document.name;
        let formData = new FormData();
        formData.append('file', file, fullname);
        document.uploadXhr = new XMLHttpRequest();
        //
        const args = [];
        if (params) {
            if (params.visibility === 'public' || params.visibility === 'protected') {
                args.push(`${params.visibility}=true`)
            }
            if (params.application) {
                args.push(`application=${params.application}`)
            }
        }
        if (document.role() === 'img') {
            args.push(`quality=1`);
        }
        if (document.eParent) {
            args.push(`parentId=${document.eParent}`)
        }
        let path = `/workspace/document?${args.join("&")}`;
        document.uploadXhr.open('POST', path);
        if (xsrfCookie) {
            document.uploadXhr.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
        }

        document.uploadXhr.send(formData);
        document.uploadXhr.onprogress = (e) => {
            document.eventer.trigger('progress', e);
        }

        const res = new Promise<Document>((resolve, reject) => {
            document.uploadXhr.onload = async () => {
                if (document.uploadXhr.status >= 200 && document.uploadXhr.status < 400) {
                    document.eventer.trigger('loaded');
                    document.uploadStatus = "loaded";
                    const result = JSON.parse(document.uploadXhr.responseText);
                    document.uploadXhr = null;
                    if (parent && parent.isShared) {
                        document._isShared = parent.isShared;
                    }
                    resolve(document);
                    document._id = result._id;
                    document.name = result.name;
                    document.updateProps();
                    document.fromMe();//make behaviour working
                    //load behaviours and myRights
                    document.behaviours("workspace");
                    workspaceService.onChange.next({ action: "add", elements: [document], dest: parent })
                }
                else {
                    if (document.uploadXhr.status === 413) {

                        if (!MAX_FILE_SIZE)
                            MAX_FILE_SIZE = parseInt(lang.translate('max.file.size'));
                        notify.error(lang.translate('file.too.large.limit') + (MAX_FILE_SIZE / 1024 / 1024) + lang.translate('mb'));
                    } else if (document.uploadXhr.status === 403) {
                        notify.error("upload.forbidden")
                    }
                    else {
                        const error = JSON.parse(document.uploadXhr.responseText);
                        notify.error(error.error);
                    }
                    document.eventer.trigger('error');
                    document.uploadStatus = "failed";
                    document.uploadXhr = null;
                    reject()
                }
            }
        });
        return res;
    },
    async importZip(file: File | Blob, zip: Document, parent?: workspaceModel.Element, params?: { visibility?: "public" | "protected", application?: string }): Promise<Document[]> {
        zip.eType = workspaceModel.FILE_TYPE;
        zip.eParent = parent ? parent._id : null;
        zip.uploadStatus = "loading";
        zip.fromFile(file);
        //
        let formData = new FormData();
        formData.append('file', file);
        zip.uploadXhr = new XMLHttpRequest();
        //
        const args = [];
        if (params) {
            if (params.visibility === 'public' || params.visibility === 'protected') {
                args.push(`${params.visibility}=true`)
            }
            if (params.application) {
                args.push(`application=${params.application}`)
            }
        }
        if (zip.eParent) {
            args.push(`parentId=${zip.eParent}`)
        }
        let path = `/workspace/zip?${args.join("&")}`;
        zip.uploadXhr.open('POST', path);
        if (xsrfCookie) {
            zip.uploadXhr.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
        }

        zip.uploadXhr.send(formData);
        zip.uploadXhr.onprogress = (e) => {
            zip.eventer.trigger('progress', e);
        }

        const res = new Promise<Document[]>((resolve, reject) => {
            zip.uploadXhr.onload = async () => {
                if (zip.uploadXhr.status >= 200 && zip.uploadXhr.status < 400) {
                    zip.eventer.trigger('loaded');
                    zip.uploadStatus = "loaded";
                    const result = JSON.parse(zip.uploadXhr.responseText);
                    const documents: workspaceModel.Element[] = result.saved;
                    const res = documents.map(e=>{
                        let val: workspaceModel.Element;
                        if(e.eType==workspaceModel.FOLDER_TYPE){
                            val = mapFolder(e);
                        }else{
                            val = mapDocuments(e);
                        }
                        val.uploadStatus = "loaded";
                        val.updateProps();
                        val.fromMe();//make behaviour working
                        //load behaviours and myRights
                        val.behaviours("workspace");
                        return val;
                    })
                    resolve(res as any);
                    const elts = res.filter(e=>(!parent && !e.eParent) || (parent && e.eParent==parent._id));
                    workspaceService.onChange.next({ action: "add", elements: elts, dest: parent })
                    if(result.errors && result.errors.length){
                        notify.error("folder.zip.upload.partial");
                    }
                    zip.uploadXhr = null;
                }
                else {
                    if (zip.uploadXhr.status === 413) {
                        if (!MAX_FILE_SIZE)
                            MAX_FILE_SIZE = parseInt(lang.translate('max.file.size'));
                        notify.error(lang.translate('file.too.large.limit') + (MAX_FILE_SIZE / 1024 / 1024) + lang.translate('mb'));
                    } else if (zip.uploadXhr.status === 403) {
                        notify.error("upload.forbidden")
                    }
                    else {
                        const error = JSON.parse(zip.uploadXhr.responseText);
                        notify.error(error.error, 20000);
                    }
                    zip.eventer.trigger('error');
                    zip.uploadStatus = "failed";
                    zip.uploadXhr = null;
                    reject()
                }
            }
        });
        return res;
    },
    async getDocumentBlob(id: string): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/workspace/document/' + id, true);
            xhr.responseType = 'blob';
            xhr.onload = function (e) {
                if (xhr.status == 200) {
                    resolve(xhr.response);
                } else {
                    reject("Failed with status code: " + xhr.status);
                }
            }
            xhr.send();
        })
    },
    async getPreviewBlob(id: string): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/workspace/document/preview/${id}`, true);
            xhr.responseType = 'blob';
            xhr.onload = function (e) {
                if (xhr.status == 200) {
                    resolve(xhr.response);
                } else {
                    reject("Failed with status code: " + xhr.status);
                }
            }
            xhr.send();
        })
    },
    async copyDocumentWithVisibility(source: workspaceModel.Element, args: { visibility: "public" | "protected", application: string }, parent?: workspaceModel.Element) {
        const blob = await workspaceService.getDocumentBlob(source._id);
        const clone = new Document;
        Object.assign(clone, source);
        clone._id = null;
        return workspaceService.createDocument(blob, clone, parent, { visibility: args.visibility, application: args.application })
    },
    async   updateDocument(file: File | Blob, document: workspaceModel.Element): Promise<workspaceModel.Element> {
        const formData = new FormData();
        let newName = document.name || document.title;
        const extension = document.metadata && document.metadata.extension;
        if (extension && newName.indexOf(extension) === -1) {
            newName += '.' + extension;
        }
        formData.append('file', file, newName);
        const args = ['quality=1'];
        (document.alt) && args.push('alt=' + document.alt);
        (document.legend) && args.push('legend=' + document.legend);
        await http().putFile(`/workspace/document/${document._id}?${args.join("&")}`, formData);
        document.currentQuality = 1;
        document.version = Math.floor(Math.random() * 100);
        document.eventer.trigger('save');
        workspaceService.onChange.next({ action: "document-change", elements: [document] });
        return document;
    },
    async createFolder(folder: workspaceModel.Element, parent?: workspaceModel.Element): Promise<{ error?: string } | workspaceModel.Element> {
        const name = folder.name;
        const parentFolderId = parent ? parent._id : null;
        const externalId = folder.externalId ? folder.externalId : null;
        const p = http().post('/workspace/folder', { name, parentFolderId, shared: folder.shared, externalId});
        let error = null;
        let copy: workspaceModel.Element = null;
        p.e400((e) => {
            error = JSON.parse(e.responseText).error;
            if(error && error.indexOf("duplicate")){
                notify.error(idiom.translate(error));
            }
        });
        const res = await p.then(e => {
            folder._id = e["_id"];
            copy = new workspaceModel.Element(folder);
            parent && (copy.eParent = parent._id)
            copy.fromMe();//make behaviours working
            //load behaviours and myRights
            copy.behaviours("workspace");
            if (parent && parent.isShared) {
                copy._isShared = true;
            }
            if (!copy.children) {
                copy.children = []
            }
            if (!copy.ancestors) {
                copy.ancestors = parent ? [].concat(parent.ancestors || []).concat([parent._id]) : []
            }
            workspaceService.onChange.next({ action: "add", elements: [copy], dest: parent })
            return Promise.resolve(copy)
        });
        return error == null ? res : { error };
    },
    async createFolders(folder: workspaceModel.Element, parents: workspaceModel.Element[]): Promise<any> {
        const promises = parents.map(p => workspaceService.createFolder(folder, p));
        return Promise.all(promises)
    },
    async syncHistory(doc: workspaceModel.Element) {
        const revisions = await http<workspaceModel.Revision[]>().get("/workspace/document/" + doc._id + "/revisions");
        doc.revisions = revisions;
        return doc;
    },
    createRevision(file: string, doc: workspaceModel.Element, listener: (state: "pending" | "end" | "error", error?: string) => void) {
        if (!file) {
            return;
        }
        const data = new FormData()
        data.append("file", file)
        const httpO = httpOriginal();
        httpO.bind('request-started.add-revision', function () {
            listener("pending")
        });
        httpO.bind('request-ended.add-revision', function () {
            listener("end")
        });
        const p = http(httpO).putFile(`/workspace/document/${doc._id}`, data, { requestName: 'add-revision' });
        p.e400(function (e) {
            const error = JSON.parse(e.responseText);
            listener("error", error);
        });
        p.then(e => {
            workspaceService.onChange.next({ action: "document-change", elements: [doc] });
        });
        return p
    },
    deleteRevision(rev: workspaceModel.Revision): Promise<any> {
        return http().delete(`/workspace/document/${rev.documentId}/revision/${rev._id}`);
    },
    resetAllCache(tree: workspaceModel.Node, type:"document"|"folder"|"all", matching: (el: workspaceModel.Node) => boolean = (_)=> true): void {
        const iterator = function (cursor: workspaceModel.Node) {
            const current = cursor as workspaceModel.Element;
            if (current.children) {
                for (let child of current.children) {
                    iterator(child);
                }
                if(matching(current)){
                    if(type=="document" || type =="all"){
                        current.cacheDocument.reset();
                    }
                    if(type=="folder" || type =="all"){
                        current.cacheChildren.reset();
                    }
                }
            }
        }
        iterator(tree)
    },
}

workspaceService.onChange.subscribe(event => {
    //if add files => dont notify (onConfirmImport)
    if (event.action == "add" && event.elements && event.elements.filter(el => workspaceService.isFolder(el)).length == 0) {
        return;
    }
    //on create revision or update doc (edit picture on image editor)
    if (event.action == "document-change" && (event.elements && event.elements.length)) {
        const elts:workspaceModel.Element[] = event.elements;
        const destFolderIds: string[] = elts.filter(el => el.eParent).map(el => el.eParent);
        const uniqDestFolderIds = destFolderIds.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
        //
        if (uniqDestFolderIds.length == 0) {
            workspaceService.notifyContrib(null, elts, true)
        } else {
            uniqDestFolderIds.forEach(dest => {
                const children = elts.filter(el => el.eParent == dest);
                workspaceService.notifyContrib(dest, children, true)
            })
        }
        return;
    }
    //on other actions (copy, move...)
    if (event.dest && event.dest.isShared && ((event.elements && event.elements.length) || (event.ids && event.ids.length))) {
        workspaceService.notifyContrib(event.dest._id, event.elements || event.ids)
    }
})
workspaceService.onConfirmImport.subscribe((elts:workspaceModel.Element[]) => {
    const destFolderIds: string[] = elts.filter(el => el.eParent).map(el => el.eParent);
    const uniqDestFolderIds = destFolderIds.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
    //
    uniqDestFolderIds.forEach(dest => {
        const children = elts.filter(el => el.eParent == dest);
        workspaceService.notifyContrib(dest, children)
    })
})
const initLazyMode=async ()=>{
    try{
        if(!window.location.pathname.startsWith("/workspace")){
            const conf = await http().get('/workspace/conf/public');
            (window as any).LAZY_MODE = conf["lazy-mode"];
            conf["ttl-documents"] && (workspaceModel.Element.cacheConfiguration.ttlDocumentSeconds = conf["ttl-documents"]);
            conf["ttl-folders"] && (workspaceModel.Element.cacheConfiguration.ttlFolderSeconds = conf["ttl-folders"]);
        }else{
            ((window as any).CACHE_DOC_TTL_SEC > 0) && (workspaceModel.Element.cacheConfiguration.ttlDocumentSeconds = (window as any).CACHE_DOC_TTL_SEC)
            ((window as any).CACHE_FOLDER_TTL_SEC > 0) && (workspaceModel.Element.cacheConfiguration.ttlFolderSeconds = (window as any).CACHE_FOLDER_TTL_SEC)
        }
    }catch(e){
        console.warn("[workspaceService.initLazyMode] failed: ",e)
    }
}
initLazyMode();
