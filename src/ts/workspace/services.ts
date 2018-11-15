import { model } from '../modelDefinitions';
import { http as httpOriginal, httpPromisy as http, PromiseHttp } from '../http';
import { idiom as lang } from '../idiom';
import { notify } from '../notify';
import { MediaLibrary } from './workspace-v1';
import * as workspaceModel from "./model";
import { Subject } from "rxjs";

export interface ElementQuery {
    parentId?: string
    hierarchical?: boolean
    filter: workspaceModel.TREE_NAME,
    search?: string
    includeall?: boolean
}

export interface WorkspaceEvent {
    action: "add" | "update" | "document-change" | "tree-change" | "delete" | "empty"
    treeSource?: workspaceModel.TREE_NAME
    treeDest?: workspaceModel.TREE_NAME
    dest?: workspaceModel.Element
    elements?: workspaceModel.Element[]
    ids?: string[]
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
    view?: WorkspacePreferenceView
    quickstart?: "viewed" | "notviewed"
}
export type WorkspacePreferenceView = "list" | "icons" | "carousel";
export const workspaceService = {
    onChange: new Subject<WorkspaceEvent>(),
    onImportFiles: new Subject<FileList>(),
    onConfirmImport: new Subject<workspaceModel.Element[]>(),
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
    async fetchTrees(params: ElementQuery, sort: "name" | "created" = "name"): Promise<workspaceModel.Tree[]> {
        let folders: workspaceModel.Element[] = await http<workspaceModel.Element[]>().get('/workspace/folders/list', params);
        //create models
        folders = folders.map(f => {
            const ff = new workspaceModel.Element(f);
            //load behaviours and myRights
            const res = ff.behaviours("workspace");
            //load rights
            if (res instanceof Promise) {
                res.then(_ => ff.rights && ff.rights.fromBehaviours())
            } else {
                ff.rights && ff.rights.fromBehaviours();
            }
            return ff;
        });
        //sorts
        let sorts = workspaceModel.sortByCreatedAsc();
        switch (sort) {
            case "created":
                sorts = workspaceModel.sortByCreatedAsc();
                break;
            case "name":
                sorts = workspaceModel.sortByNameAsc();
                break;
        }
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
        trees.push(buildTree("shared", el => el.isShared && !el.deleted))
        trees.push(buildTree("trash", el => el.deleted))
        trees.push(buildTree("protected", el => el.protected));
        trees.push(buildTree("owner", _ => true));//all others
        //
        return trees;
    },
    async fetchDocuments(params: ElementQuery, sort: "name" | "created" = "name"): Promise<workspaceModel.Element[]> {
        let files: workspaceModel.Element[] = await http<workspaceModel.Element[]>().get('/workspace/documents', params);
        //create models
        files = files.map(f => {
            const ff = new workspaceModel.Element(f);
            //load behaviours and myRights
            const res = ff.behaviours("workspace");
            //load rights
            if (res instanceof Promise) {
                res.then(_ => ff.rights && ff.rights.fromBehaviours())
            } else {
                ff.rights && ff.rights.fromBehaviours();
            }
            return ff;
        });
        if (sort == "created") {
            return files.sort(workspaceModel.sortByCreatedAsc())
        } else {
            return files.sort(workspaceModel.sortByNameAsc())
        }
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
                current.children = current.children.filter(el => !matching(el));
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
    rename(el: workspaceModel.Element, newName: string): Promise<any> {
        let res = null;
        if (workspaceService.isFile(el)) {
            res = http().putJson("/workspace/rename/" + el._id, { name: newName });
        } else {
            res = http().putJson("/workspace/folder/rename/" + el._id, { name: newName });
        }
        res.then(e => {
            workspaceService.onChange.next({ action: "update", elements: [{ name: newName, eType: el.eType, _id: el._id } as workspaceModel.Element] });
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
    downloadFiles(els: workspaceModel.Element[]) {
        const ids = els.map(d => d._id).join(",");
        window.open(`/workspace/document/archive/${ids}`)
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
    notifyContrib(folder: workspaceModel.Element, els: workspaceModel.Element[]) {
        if (folder._id && folder.isShared && folder.owner.userId != model.me.userId) {
            return http().post("/workspace/folder/notify/contrib/" + folder._id)
        } else {
            return Promise.resolve();
        }
    },
    async createDocument(file: File | Blob, document: workspaceModel.Element, parent?: workspaceModel.Element, params?: { visibility?: "public" | "protected", application?: string }): Promise<workspaceModel.Element> {
        document.eType = workspaceModel.FILE_TYPE;
        document.eParent = parent ? parent._id : null;
        document.uploadStatus = "loading";
        document.fromFile(file);
        //
        let formData = new FormData();
        formData.append('file', file, document.name);
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
            args.push(`quality=1&${MediaLibrary.thumbnails}`);
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

        const res = new Promise<workspaceModel.Element>((resolve, reject) => {
            document.uploadXhr.onload = async () => {
                if (document.uploadXhr.status >= 200 && document.uploadXhr.status < 400) {
                    document.eventer.trigger('loaded');
                    document.uploadStatus = "loaded";
                    const result = JSON.parse(document.uploadXhr.responseText);
                    document.uploadXhr = null;
                    resolve(document);
                    document._id = result._id;
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
    async copyDocumentWithVisibility(source: workspaceModel.Element, args: { visibility: "public" | "protected", application: string }, parent?: workspaceModel.Element) {
        const blob = await workspaceService.getDocumentBlob(source._id);
        const clone = new workspaceModel.Element;
        Object.assign(clone, source);
        clone._id = null;
        return workspaceService.createDocument(blob, clone, parent, { visibility: args.visibility, application: args.application })
    },
    async updateDocument(file: File | Blob, document: workspaceModel.Element): Promise<workspaceModel.Element> {
        const formData = new FormData();
        let newName = document.name || document.title;
        const extension = document.metadata && document.metadata.extension;
        if (extension && newName.indexOf(extension) === -1) {
            newName += '.' + extension;
        }
        formData.append('file', file, newName);
        const args = [MediaLibrary.thumbnails, 'quality=1'];
        (document.alt) && args.push('alt=' + document.alt);
        (document.legend) && args.push('legend=' + document.legend);
        await http().putFile(`/workspace/document/${document._id}?${args.join("&")}`, formData);
        document.currentQuality = 1;
        document.version = Math.floor(Math.random() * 100);
        document.eventer.trigger('save');
        return document;
    },
    async createFolder(folder: workspaceModel.Element, parent?: workspaceModel.Element): Promise<{ error?: string } | workspaceModel.Element> {
        const name = folder.name;
        const parentFolderId = parent ? parent._id : null;
        const p = http().post('/workspace/folder', { name, parentFolderId, shared: folder.shared });
        let error = null;
        let copy: workspaceModel.Element = null;
        p.e400((e) => {
            error = JSON.parse(e.responseText).error;
        });
        p.then(e => {
            folder._id = e["_id"];
            copy = new workspaceModel.Element(folder);
            copy.fromMe();//make behaviours working
            //load behaviours and myRights
            copy.behaviours("workspace");
            if (parent && parent.isShared) {
                copy._isShared = true;
            }
            workspaceService.onChange.next({ action: "add", elements: [copy], dest: parent })
            return Promise.resolve(copy)
        })
        const res = await p;
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
        const p = http(httpO).putFile(`/workspace/document/${doc._id}?thumbnail=120x120&thumbnail=290x290`, data, { requestName: 'add-revision' });
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
    }
}
