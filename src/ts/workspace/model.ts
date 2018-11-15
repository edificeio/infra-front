// Copyright © WebServices pour l'Éducation, 2014
//
// This file is part of ENT Core. ENT Core is a versatile ENT engine based on the JVM.
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation (version 3 of the License).
//
// For the sake of explanation, any module that communicate over native
// Web protocols, such as HTTP, with ENT Core is outside the scope of this
// license and could be license under its own terms. This is merely considered
// normal use of ENT Core, and does not fall under the heading of "covered work".
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

import { Model, model } from '../modelDefinitions';
import { Rights, Shareable } from '../rights';
import * as moment from 'moment';

import { Selectable, Eventer } from 'entcore-toolkit';
import { workspaceService } from './services';

export const MEDIALIB_APPNAME = "media-library";
export type TREE_NAME = "owner" | "shared" | "protected" | "public" | "trash" | "all";
export const FOLDER_TYPE = "folder";
export const FILE_TYPE = "file";

export interface Node {
    _id?: string
    children: Node[]
    name?: string
}

export interface Tree extends Node {
    name: string
    children: Element[]
    filter?: TREE_NAME
    hierarchical?: boolean
    helpbox?: string
    buttons?: { text: string, action: () => any, icon?: boolean, workflow?: string }[]
    contextualButtons?: { text: string, action: () => any, allow?: () => boolean, right?: string }[]
}


export interface Comment {
    id: string
    author: string
    authorName: string
    comment: string
    posted: boolean
}
export interface Revision {
    _id?: string
    documentId: string
}
//file or folder
export class Element extends Model implements Node, Shareable, Selectable {
    _id?: string;
    eType: string;
    eParent: string;
    name: string;
    title?: string
    file?: string
    deleted?: boolean
    children: Element[] = [];
    created: moment.Moment
    //shared
    _shared: any[];
    inheritedShares?: any[];
    _isShared: boolean
    //
    showComments?: boolean = false
    editing?: boolean = false
    revisions?: Revision[] = []
    //comments
    comments?: Comment[] = []
    comment?: string
    // 
    rights: Rights<Element>
    ownerName?: string;
    owner: { userId: string, displayName: string }
    //upload
    uploadStatus?: "loading" | "loaded" | "failed" | "abort"
    uploadXhr?: XMLHttpRequest
    hiddenBlob?: Blob
    eventer = new Eventer();
    //
    newName?: string
    newProperties?: {
        name?: string;
        legend?: string;
        alt?: string;
    };
    metadata?: {
        'content-type'?: string;
        role?: string;
        extension?: string;
        filename?: string;
        size?: number;
    };
    link?: string;
    icon?: string;
    version?: number;
    currentQuality?: number;
    application?: string
    legend?: string;
    alt?: string;
    //visibility
    protected?: boolean
    public?: boolean
    constructor(data?: any) {
        super(data);
        this.version = parseInt("" + (Math.random() * 100));
        this.revisions = [];
        this.fromJSON(data);
    }
    fromJSON(data) {
        if (!data) {
            return;
        }
        //comments
        this.comments = data.comments || this.comments;
        //created
        if (data.created) {
            if (data.created instanceof Date) {
                this.created = moment(data.created);
            } else if (typeof data.created == "string") {
                this.created = moment(data.created.split('.')[0]);
            } else {
                this.created = moment(data.created)
            }
        }
        else if (data.sent) {
            this.created = moment(data.sent.split('.')[0]);
        }
        else {
            this.created = moment();
        }
        //
        if (data.metadata) {
            const dotSplit = data.metadata.filename.split('.');
            this.metadata.extension = dotSplit[dotSplit.length - 1];
            if (dotSplit.length > 1) {
                dotSplit.length = dotSplit.length - 1;
            }
            this.title = dotSplit.join('.');
        }
        //owner
        this.owner = { userId: data.owner, displayName: data.ownerName };
        this.updateProps();
    }
    fromMe() {
        this.owner = {
            displayName: model.me.username,
            userId: model.me.userId
        }
        this.ownerName = this.owner.displayName;
    }
    updateProps() {
        this.link = '/workspace/document/' + this._id;
        if (this.metadata) {
            this.metadata.role = this.role();
            if (this.metadata.role === 'img') {
                this.icon = this.link;
            }
        }
        this.newProperties = {
            alt: this.alt,
            legend: this.legend,
            name: this.name
        }
    }
    set shared(s) {
        this._shared = s;
    }
    get shared() {
        return this.inheritedShares || this._shared;
    }
    get canCopy() {
        return this.owner.userId == model.me.userId || this.myRights["read"];
    }
    get canMove() {
        return this.owner.userId == model.me.userId || this.myRights["manager"];
    }
    get canWriteOnFolder() {
        return this.eType == FOLDER_TYPE && (this.owner.userId == model.me.userId || this.myRights["contrib"])
    }

    /**
     * used by image editor
     */
    async saveChanges() {
        this.applyNewProperties();
        await this.applyBlob();
    }
    /**
     * used by image editor
     */
    async applyBlob() {
        if (this.hiddenBlob) {
            await workspaceService.updateDocument(this.hiddenBlob, this);
            this.hiddenBlob = undefined;
        }
    }
    //
    resetNewProperties() {
        if (!this.name) {
            this.name = this.title;
        }
        this.newProperties = {
            alt: this.alt,
            legend: this.legend,
            name: this.name.replace('.' + this.metadata.extension, '')
        }
    }

    abortUpload() {
        (this.uploadXhr) && this.uploadXhr.abort();
        this.uploadXhr = null;
        this.uploadStatus = "abort";
    }
    fromFile(file: File | Blob) {
        const name = (file as File).name || this.name || "";
        if (!this.metadata || !this.metadata['content-type']) {
            const nameSplit = name.split('.');
            this.metadata = {
                'content-type': file.type || 'application/octet-stream',
                'filename': name,
                size: file.size,
                extension: nameSplit[nameSplit.length - 1]
            };
            this.metadata.role = this.role();
        }
        this.title = name;
        this.name = name.replace('.' + this.metadata.extension, '');
    }
    get isShared() {
        return (this.shared && this.shared.length > 0) || (this.inheritedShares && this.inheritedShares.length > 0) || this._isShared;
    }
    set isShared(b: boolean) {
        this._isShared = b
    }
    get isEditableImage() {
        const editables = ['jpg', 'jpeg', 'bmp', 'png'];
        const ext = this.metadata['content-type'].split('/')[1].toLowerCase();
        return editables.indexOf(ext) !== -1 && this.uploadStatus !== "loading" && this.uploadStatus !== "failed";
    }

    toJSON() {
        const { _id, title, metadata, version, name, shared, created, eParent, eType, link, icon, owner } = this;
        return {
            _id,
            name,
            title,
            created,
            eParent,
            eType,
            metadata,
            version,
            link,
            icon,
            owner,
            shared,
        };
    }

    role() {
        return this.metadata && Element.role(this.metadata['content-type']);
    }

    static role(fileType: string) {
        if (!fileType)
            return 'unknown'

        var types = {
            'doc': function (type) {
                return type.indexOf('document') !== -1 && type.indexOf('wordprocessing') !== -1;
            },
            'xls': function (type) {
                return (type.indexOf('document') !== -1 && type.indexOf('spreadsheet') !== -1) || (type.indexOf('ms-excel') !== -1);
            },
            'img': function (type) {
                return type.indexOf('image') !== -1;
            },
            'pdf': function (type) {
                return type.indexOf('pdf') !== -1 || type === 'application/x-download';
            },
            'ppt': function (type) {
                return (type.indexOf('document') !== -1 && type.indexOf('presentation') !== -1) || type.indexOf('powerpoint') !== -1;
            },
            'video': function (type) {
                return type.indexOf('video') !== -1;
            },
            'audio': function (type) {
                return type.indexOf('audio') !== -1;
            },
            'zip': function (type) {
                return type.indexOf('zip') !== -1 ||
                    type.indexOf('rar') !== -1 ||
                    type.indexOf('tar') !== -1 ||
                    type.indexOf('7z') !== -1;
            }
        };

        for (let type in types) {
            if (types[type](fileType)) {
                return type;
            }
        }

        return 'unknown';
    }

    get differentProperties() {
        if (!this.name && this.title) {
            this.name = this.title.replace('.' + this.metadata.extension, '');
        }
        let diff = false;
        for (let prop in this.newProperties) {
            diff = diff || this.newProperties[prop] !== this[prop];
        }
        return diff;
    }
    applyNewProperties() {
        if (this.differentProperties) {
            this.name = this.newProperties.name;
            this.alt = this.newProperties.alt;
            this.legend = this.newProperties.legend;
        }
    }
}

export class FolderContext {
    private originalDocuments: Element[] = []
    private filteredDocuments: Element[] = []
    private filteredFolders: Element[] = []
    private filtered = false;
    constructor(public folder: Element = emptyFolder()) {
        this.setFolder(folder);
    }
    setFolder(f: Element) {
        this.folder = f;
    }
    setDocuments(c: Element[]) {
        this.originalDocuments = c;
    }
    setFilter(all: Element[]) {
        this.filteredFolders = all.filter(a => a.eType == FOLDER_TYPE);
        this.filteredDocuments = all.filter(a => a.eType == FILE_TYPE);
        this.filtered = true;
    }
    applyFilter(filter: (el: Element) => boolean) {
        this.filteredDocuments = this.originalDocuments.filter(filter);
        this.filteredFolders = this.folder.children.filter(filter);
        this.filtered = true;
    }
    pushDoc(el: Element) {
        this.originalDocuments.push(el)
    }
    findDocuments(filter: (el: Element) => boolean) {
        let co = this.originalDocuments.filter(filter);
        return co;
    }
    deleteDocuments(matching: (el: Element) => boolean) {
        this.originalDocuments = this.originalDocuments.filter(el => !matching(el));
        return this.originalDocuments;
    }
    restore() {
        this.filtered = false;
    }
    get documents() {
        return this.filtered ? this.filteredDocuments : this.originalDocuments;
    }
    get folders() {
        return this.filtered ? this.filteredFolders : this.folder.children;
    }
    get all() {
        return [...this.folders, ...this.documents]
    }
}


export function emptySharedFolder(): Element {
    //model object (because need Rights)
    return new Element({
        name: '',
        eType: FOLDER_TYPE,
        eParent: undefined,
        shared: [],
        children: []
    });
}


export function emptyFolder(): Element {
    //literal object to avoid additionnal properties
    return {
        name: '',
        eType: FOLDER_TYPE,
        eParent: undefined,
        shared: [],
        children: []
    } as any;
}

export function emptyDoc(): Element {
    //literal object to avoid additionnal properties
    return {
        name: '',
        eType: FILE_TYPE,
        eParent: undefined,
        shared: [],
        children: []
    } as any;
}

export function sortByCreatedAsc() {
    return (doc1: Element, doc2: Element): number => {
        if (moment(doc1.created) > moment(doc2.created)) {
            return -1;
        }
        if (moment(doc1.created) < moment(doc2.created)) {
            return 1;
        }
        return 0;
    }
}

export function sortByNameAsc() {
    return (doc1: Element, doc2: Element) => {
        if (doc1 && doc2 && doc1.name && doc2.name) {
            return doc1.name.localeCompare(doc2.name);
        }
        return 0;
    }
}

export function emptyNode(name?: string): Node {
    return {
        name,
        children: []
    }
}