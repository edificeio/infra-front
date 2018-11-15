import { _ } from '../libs/underscore/underscore';
import { idiom as lang } from '../idiom';
import http from 'axios';
import { Eventer, Mix, Selection, Selectable } from 'entcore-toolkit';
import { model } from '../modelDefinitions';
import * as workspaceModel from "./model"
import { workspaceService } from "./services"
//
let xsrfCookie;
if (document.cookie) {
    let cookies = _.map(document.cookie.split(';'), function (c) {
        return {
            name: c.split('=')[0].trim(),
            val: c.split('=')[1].trim()
        };
    });
    xsrfCookie = _.findWhere(cookies, { name: 'XSRF-TOKEN' });
}

export class Quota {
    max: number;
    used: number;
    unit: string;

    constructor() {
        this.max = 1;
        this.used = 0;
        this.unit = 'Mo'
    }

    appropriateDataUnit(bytes: number) {
        var order = 0
        var orders = {
            0: lang.translate("byte"),
            1: "Ko",
            2: "Mo",
            3: "Go",
            4: "To"
        }
        var finalNb = bytes
        while (finalNb >= 1024 && order < 4) {
            finalNb = finalNb / 1024
            order++
        }
        return {
            nb: finalNb,
            order: orders[order]
        }
    }

    async refresh(): Promise<void> {
        const response = await http.get('/workspace/quota/user/' + model.me.userId);
        const data = response.data;
        //to mo
        data.quota = data.quota / (1024 * 1024);
        data.storage = data.storage / (1024 * 1024);

        if (data.quota > 2000) {
            data.quota = Math.round((data.quota / 1024) * 10) / 10;
            data.storage = Math.round((data.storage / 1024) * 10) / 10;
            this.unit = 'Go';
        }
        else {
            data.quota = Math.round(data.quota);
            data.storage = Math.round(data.storage);
        }

        this.max = data.quota;
        this.used = data.storage;
    }
};

export let quota = new Quota();

export class Revision implements workspaceModel.Revision {
    _id?: string
    documentId: string
}

export enum DocumentStatus {
    initial = 'initial', loaded = 'loaded', failed = 'failed', loading = 'loading'
}

export class Document extends workspaceModel.Element {
    set canCopy(a) {
        //need for mixcast
    }
    set canMove(a) {
        //need for mixcast
    }
    set canWriteOnFolder(a) {
        //need for mixcast
    }
    set isEditableImage(a) {
        //need for mixcast
    }
    set differentProperties(a) {
        //need for mixcast
    }
    async delete() {
        await workspaceService.deleteAll([this]);
    }

    abort() {
        super.abortUpload();
    }

    get size(): string {
        const koSize = this.metadata.size / 1024;
        if (koSize > 1024) {
            return (parseInt(koSize / 1024 * 10) / 10) + ' Mo';
        }
        return Math.ceil(koSize) + ' Ko';
    }

    async loadProperties() {
        const response = await http.get(`/workspace/document/properties/${this._id}`);
        var dotSplit = response.data.name.split('.');
        this.metadata.extension = dotSplit[dotSplit.length - 1];
        if (dotSplit.length > 1) {
            dotSplit.length = dotSplit.length - 1;
        }

        this.alt = response.data.alt;
        this.newProperties.alt = response.data.alt;
        this.legend = response.data.legend;
        this.newProperties.legend = response.data.legend;
        this.title = dotSplit.join('.');
        this.newProperties.name = response.data.name.replace('.' + this.metadata.extension, '');
        this.metadata.role = this.role();
    }

    async refreshHistory() {
        await workspaceService.syncHistory(this);
    }

    upload(file: File | Blob, visibility?: 'public' | 'protected' | 'owner', application = "media-library", parent?: workspaceModel.Element): Promise<workspaceModel.Element> {
        visibility = (visibility === "public" || visibility === "protected") ? visibility : null
        return workspaceService.createDocument(file, this, parent, { visibility, application });
    }

    async protectedDuplicate(callback?: (document: Document) => void): Promise<Document> {
        const temp = await workspaceService.copyDocumentWithVisibility(this, { visibility: "protected", application: "media-library" });
        const res = Mix.castAs(Document, temp)
        callback && callback(res);
        return res;
    }

    async publicDuplicate(callback?: (document: Document) => void) {
        const temp = await workspaceService.copyDocumentWithVisibility(this, { visibility: "public", application: "media-library" });
        const res = Mix.castAs(Document, temp)
        callback && callback(res);
        return res;
    }

    async update(blob: Blob) {
        let newName = this.name || this.title;
        if (newName.indexOf(this.metadata.extension) === -1) {
            newName += '.' + this.metadata.extension;
        }
        this.name = newName;
        await workspaceService.updateDocument(blob, this)
        this.currentQuality = 1;
        this.version = Math.floor(Math.random() * 100);
        this.eventer.trigger('save');
    }


    async trash(): Promise<any> {
        return workspaceService.trashAll([this]);
    }
}

export class Folder implements Selectable {
    _id: string;
    eParent: string;
    selected: boolean;
    name: string = "";
    folders = new Selection<Folder>([]);
    documents = new Selection<Document>([]);
    owner: string;
    constructor(f?: workspaceModel.Element) {
        if (f) {
            this._id = f._id;
            this.eParent = f.eParent;
            this.owner = f.ownerName;
            this.name = f.name || "";
            for (let child of f.children) {
                this.folders.push(new Folder(child))
            }
        }
    }
    setChildren(children: workspaceModel.Element[]) {
        for (let child of children) {
            this.folders.push(new Folder(child))
        }
    }
    deselectAll() {
        this.documents.forEach(d => d.selected = false);
        this.folders.all.forEach(f => f.deselectAll());
    }

    closeFolder() {
        this.folders.all = [];
    }

    isOpened(currentFolder: Folder) {
        return currentFolder && (//
            (currentFolder._id === this._id)//
            || currentFolder === this//
        );
    }

    isOpenedRecursive(currentFolder: Folder) {
        if (this.isOpened(currentFolder)) {
            return true;
        }
        return this.folders.filter((f: Folder) => {
            return f.isOpened(currentFolder);
        }).length > 0;
    }

    async sync() {
        const response = await workspaceService.fetchDocuments({ filter: "owner", parentId: this._id || "" });
        this.documents.all.splice(0, this.documents.all.length);
        this.documents.addRange(Mix.castArrayAs(Document, response));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class MyDocuments extends Folder {

    async sync() {
        const response = await workspaceService.fetchDocuments({ filter: "owner", parentId: this._id || "" });
        this.documents.all.splice(0, this.documents.all.length);
        this.documents.addRange(Mix.castArrayAs(Document, response));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class SharedDocuments extends Folder {

    async sync() {
        const response = await workspaceService.fetchDocuments({ filter: "shared", parentId: this._id || "" });
        this.documents.all.splice(0, this.documents.all.length);
        this.documents.addRange(Mix.castArrayAs(Document, response));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class AppDocuments extends Folder {
    async sync() {
        const response = await workspaceService.fetchDocuments({ filter: "protected", parentId: this._id || "" });
        this.documents.all.splice(0, this.documents.all.length);
        this.documents.addRange(Mix.castArrayAs(Document, response));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class PublicDocuments extends Folder {
    async sync() {
        const docResponse = await workspaceService.fetchDocuments({ filter: "public", parentId: this._id || "" })
        this.documents.all.splice(0, this.documents.all.length);
        this.documents.addRange(Mix.castArrayAs(Document, docResponse));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class MediaLibrary {
    static synchronized = false;
    static myDocuments = new MyDocuments();
    static sharedDocuments = new SharedDocuments();
    static appDocuments = new AppDocuments();
    static publicDocuments = new PublicDocuments();
    static trashDocuments = new Folder();
    static eventer = new Eventer();

    static thumbnails = "thumbnail=120x120&thumbnail=100x100&thumbnail=290x290&thumbnail=381x381&thumbnail=1600x0";
    static async sync() {
        if (MediaLibrary.synchronized) {
            return;
        }
        try {
            MediaLibrary.synchronized = true;
            const trees = await workspaceService.fetchTrees({ filter: "all", hierarchical: true })
            for (let tree of trees) {
                switch (tree.filter) {
                    case 'owner':
                        MediaLibrary.myDocuments.setChildren(tree.children);
                        break;
                    case 'protected':
                        MediaLibrary.appDocuments.setChildren(tree.children);
                        break;
                    case 'public':
                        MediaLibrary.publicDocuments.setChildren(tree.children);
                        break;
                    case 'shared':
                        MediaLibrary.sharedDocuments.setChildren(tree.children);
                        break;
                    case 'trash':
                        MediaLibrary.trashDocuments.setChildren(tree.children);
                        break;
                }
            }
            MediaLibrary.eventer.trigger("ready")
        } catch (e) {
            MediaLibrary.synchronized = false;
        }
    }
    static deselectAll() {
        MediaLibrary.appDocuments.deselectAll();
        MediaLibrary.sharedDocuments.deselectAll();
        MediaLibrary.myDocuments.deselectAll();
    }

    static async upload(file: File | Blob, visibility?: 'public' | 'protected'): Promise<Document> {
        if (!visibility) {
            visibility = 'protected';
        }

        const doc = new Document();
        await doc.upload(file, visibility);
        return doc;
    }
}
