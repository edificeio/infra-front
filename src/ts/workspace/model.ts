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
import { MimeTypeUtils } from './mimeUtils';
import { Document } from './workspace-v1';

export const MEDIALIB_APPNAME = "media-library";
export type TREE_NAME = "owner" | "shared" | "protected" | "public" | "trash" | "all" | "external";
export const FOLDER_TYPE = "folder";
export const FILE_TYPE = "file";

export class DocumentsListModel{
	public incrementSize = 50;
	private _displayNum: number = 50;
	private _orderField: string;
	private _original:Array<Document> = [];
	private _documents:Array<Document> = [];
	constructor(private $filter:any, private _sort = false){}
	protected recompute(){
		this._documents = [...this._original];
		if(this._sort){
			this.sort();
		}
        this._documents = this.$filter('limitTo')(this._documents, this._displayNum);
        console.log('[DocumentsListModel.recompute] loading more ...', this._documents.length)
	}
    protected sort(){
        this._documents = this.$filter('orderBy')(this._documents, 'isNew')
        this._documents = this.$filter('orderBy')(this._documents, this._orderField)
    }
    get documents() { return this._documents; }
	set documents(d) { 
		this._original = d;
		this.recompute();
	}
	set orderField(d:string) { 
		this._orderField = d;
		this.recompute();
	}
	set displayNum(d:number) { 
		this._displayNum =d;
		this.recompute();
	}
	increment():void{
		this.displayNum =this._displayNum + this.incrementSize;
	}
	watch($scope:any,args:{documents:string,orderFieldDocument?:string}={documents:'documents',orderFieldDocument:'orderFieldDocument'}):DocumentsListModel{
		$scope.$watch(args.documents,(newValue)=>{
			this.documents = newValue || [];
		})
		if(this._sort){
            $scope.$watch(args.orderFieldDocument,(newValue)=>{
                this.orderField = newValue || 'name'
            })
        }
        return this;
	}
}

export interface Node {
    _id?: string
    children: Node[]
    name?: string
}

export interface Tree extends Node {
    name: string
    children: Element[]
    hidden?: boolean
    filter?: TREE_NAME
    hierarchical?: boolean
    helpbox?: string
    buttons?: { text: string, action: () => any, disabled: () => boolean, icon?: boolean, workflow?: string }[]
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

export type ContentTypeToRoleMapper = (contentType: string, previewRole:boolean) => string | undefined;
export type ElementToThumbMapper = (element: Element) => string | undefined;
export const ROLES = {
    IMG: "img",
    HTML: "html"
}
export enum ElementLoadStatus{
    Void, Loading, Loaded
}

export class CacheList<T>{
    private _updatedAt:Date
    private _resetAt:Date
    private _data:T[] = []
    private _timeout:any;
    private _status:ElementLoadStatus = ElementLoadStatus.Void;
    private _nbTry = 0;
    private _disabled = false;
    constructor(private _ttlSeconds:number, private onChange:(data:T[])=>void, private shouldClear = () => true, private _reloadOnFail=true, private _nbTryOnFail = 3){}
    get isEmpty(){return this.status==ElementLoadStatus.Void}
    get isLoading(){return this.status==ElementLoadStatus.Loading}
    get isNotEmpty(){return this.status==ElementLoadStatus.Loaded}
    get status(){return this._status;}
    get ttlSeconds() { return this._ttlSeconds; }
    get data() { return this._data; }
    get updatedAt() { return this._updatedAt; }
    get resetAt() { return this._resetAt; }
    get disabled(){return this._disabled;}
    add(data:T, matching?:(a:T,b:T)=>boolean){
        if(this.disabled) return;
        if(matching){
            this._data = this._data.filter(c=>!matching(data, c));
        }
        this.data.push(data);
    }
    remove(matching:(el: T) => boolean){
        if(this.disabled) return;
        this._data = this.data.filter(el => !matching(el));
    }
    reset(){
        console.debug("[CacheList] reseting cache:", this.data)
        clearTimeout(this._timeout);
        this._data = [];
        this._status = ElementLoadStatus.Void;
        this._resetAt = new Date();
    }
    disableCache(){
        this._disabled = true;
    }
    setData(data:T[]):void{
        if(this.disabled) return;
        this._data = data;
        this._updatedAt = new Date;
        clearTimeout(this._timeout);
        this._status = ElementLoadStatus.Loaded;
        this.onChange(this._data);
        if(this.shouldClear()){
            this._timeout = setTimeout(()=>{
                this.reset();
            },this._ttlSeconds*1000)
        }
    }
    async setAsyncData(data:Promise<T[]>):Promise<void>{
        if(this.disabled) return;
        this._status = ElementLoadStatus.Loading;
        try{
            const d = await data;
            this.setData(d);
            this._nbTry = 0;
        }catch(e){
            const shouldReTry = this._reloadOnFail && this._nbTry < this._nbTryOnFail;
            console.warn("[CacheList.setAsyncData] failed to load data. Should retry? ",shouldReTry,e)
            if(shouldReTry){
                this.reset()
                this._nbTry ++;
            }else{
                this.setData([])
            }
        }
    }
}
//
const DEFAULT_CACHE_FOLDER_SEC =  60 * 10;
const DEFAULT_CACHE_DOCUMENT_SEC =  60 * 2.5;
//file or folder
export class Element extends Model implements Node, Shareable, Selectable {
    static cacheConfiguration = {
        ttlFolderSeconds: DEFAULT_CACHE_FOLDER_SEC,
        ttlDocumentSeconds: DEFAULT_CACHE_DOCUMENT_SEC
    };
    //
    _id?: string;
    eType: string;
    eParent: string;
    name: string;
    title?: string
    file?: string
    deleted?: boolean
    children: Element[] = [];
    created: moment.Moment
    trasher?: string
    externalId?:string;
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
    ancestors: string[];
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
        captation?: boolean;
        duration?: number;
        width?: number;
        height?: number;
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
    //cache
    cacheChildren = new CacheList<Element>(Element.cacheConfiguration.ttlFolderSeconds, (data)=>{
        this.children = [...data];
    }, () => this.isShared)
    cacheDocument = new CacheList<Document>(Element.cacheConfiguration.ttlDocumentSeconds, ()=>{}, () => this.isShared)
    constructor(data?: any) {
        super(data);
        this.version = parseInt("" + (Math.random() * 100));
        this.revisions = [];
        this.fromJSON(data);
        this.rights = new Rights(this);
    }
    removeChild(matching:(el: Node) => boolean){
        this.children = this.children.filter(el => !matching(el));
        this.cacheChildren.remove(matching)
    }
    addChild(el:Element){
        this.children = this.children.filter(c=>c._id!=el._id);
        this.children.push(el);
        this.cacheChildren.add(el, (a,b)=>a._id==b._id);
    }
    updateSelf(el:Element){
        Object.assign(this,el);
    }
    updateChild(el:Element){
        const found = this.children.find(s=>s._id==el._id);
        found && found.updateSelf(el);
        const foundC = this.cacheChildren.data.find(s=>s._id==el._id);
        foundC && foundC.updateSelf(el);
    }
    removeDocument(matching:(el: Node) => boolean){
        this.cacheDocument.remove(matching)
    }
    addDocument(doc:Document){
        this.cacheDocument.add(doc,(a,b)=>a._id==b._id);
    }
    setChildren(elts:Element[]){
        this.children = elts;
        this.cacheChildren.setData(elts);
    }
    clearChildren(){
        this.setChildren([])
    }
    get isChildrenLoading(){
        return this.cacheChildren.isLoading;
    }
    get isDocumentLoading(){
        return this.cacheDocument.isLoading;
    }
    get isChildrenOrDocumentLoading(){
        return this.isDocumentLoading || this.isChildrenLoading;
    }
    get isExternal() {
        return this._id && this._id.indexOf("external_") == 0;
    }
    static createExternalFolder({ externalId, name }: { name: string, externalId: string }): Element {
        const edumediaFolder = new Element;
        edumediaFolder.eType = FOLDER_TYPE;
        edumediaFolder.name = name;
        edumediaFolder.externalId = externalId;
        edumediaFolder.owner = {
            get displayName(){
                return model.me.displayName;
            },
            get userId(){
               return model.me.userId;
            }
        }
        return edumediaFolder;
    }
    private static roleMappers: ContentTypeToRoleMapper[] = [];
    private static thumbMappers: ElementToThumbMapper[] = [];
    static registerContentTypeToRoleMapper(mapper: ContentTypeToRoleMapper) {
        this.roleMappers.push(mapper);
    }
    static registerThumbUrlMapper(mapper: ElementToThumbMapper) {
        const foundMapper: ElementToThumbMapper = this.thumbMappers.find((tm: ElementToThumbMapper) => tm.name === mapper.name);
        // prevent re-pushing same function unless we have an unspecified function name which means we are forced to push either way
        if (!mapper.name || !foundMapper) {
            this.thumbMappers.push(mapper);
        }
    }
    get contentType() {
        return this.metadata && this.metadata["content-type"];
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
            const dotSplit = (data.metadata.filename || "").split('.');
            this.metadata.extension = dotSplit.length > 1 ? dotSplit[dotSplit.length - 1] : "";
            if (dotSplit.length > 1) {
                dotSplit.length = dotSplit.length - 1;
            }
            this.title = dotSplit.join('.');
            if (this.metadata.extension) {
                this.name = this.name.replace("." + this.metadata.extension, "")
            }
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
        return this.owner.userId == model.me.userId || !!this.myRights["read"];
    }
    get canMove() {
        return this.owner.userId == model.me.userId || !!this.myRights["manager"];
    }
    get canWriteOnFolder() {
        return this.eType == FOLDER_TYPE && (this.owner.userId == model.me.userId || !!this.myRights["contrib"])
    }
    idEquals(id: string) {
        return id && this._id == id;
    }
    idInList(ids: string[]) {
        return ids.map(id => this.idEquals(id)).reduce((a1, a2) => a1 || a2, false);
    }
    anyAncestors(ids: string[]) {
        for (let id of ids) {
            if (this.ancestors.indexOf(id) > -1) {
                return true;
            }
        }
        return false;
    }
    anyParent(ids: string[]) {
        return ids.indexOf(this.eParent) > -1;
    }
    anySelf(ids: string[]) {
        return ids.indexOf(this._id) > -1;
    }
    canCopyFileIdsInto(ids: string[]) {
        //cannot copy or move an element if has no right
        //cannot move if dest is self
        //cannot move if dest is child
        //cannot move if dest is descendant
        return this.canWriteOnFolder && !this.anySelf(ids) && !this.anyParent(ids) && !this.anyAncestors(ids);
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
                extension: nameSplit.length > 1 ? nameSplit[nameSplit.length - 1] : ''
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
        const ext = this.metadata && this.metadata['content-type'].split('/')[1].toLowerCase();
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
        return this.metadata && Element.role(this.metadata['content-type'], false, this.metadata["extension"]);
    }

    previewRole() {
        return this.metadata && Element.role(this.metadata['content-type'],true, this.metadata["extension"]);
    }

    get thumbUrl() {
        for (let thumbMapper of Element.thumbMappers) {
            const thumbUri = thumbMapper(this);
            if (thumbUri) {
                return thumbUri;
            }
        }
        return `/workspace/document/${this._id}?thumbnail=120x120`;
    }

    get documentUrl(){
        return `/workspace/document/${this._id}`;
    }

    get previewUrl(){
        return `/workspace/document/preview/${this._id}`;
    }

    static role(fileType: string, previewRole: boolean = false, extension?: string) {
        extension && (extension = extension.trim());
        if (!fileType)
            return 'unknown'
        if(!this.roleMappers){
            console.warn("[Element.role] should not have emptyRoles", this);
        }
        for (let roleMapper of (this.roleMappers || [])) {
            const role = roleMapper(fileType,previewRole);
            if (role) {
                return role;
            }
        }
        const types = {
            'csv': function (type) {
                if(MimeTypeUtils.INSTANCE.isCsvLike(type, extension)){
                    return true;
                }
                return false;
            },
            'doc': function (type) {
                if(MimeTypeUtils.INSTANCE.isWordLike(type, extension)){
                    return true;
                }
                return type.indexOf('document') !== -1 && type.indexOf('wordprocessing') !== -1;
            },
            'xls': function (type) {
                if(MimeTypeUtils.INSTANCE.isExcelLike(type, extension)){
                    return true;
                }
                return (type.indexOf('document') !== -1 && type.indexOf('spreadsheet') !== -1) || (type.indexOf('ms-excel') !== -1);
            },
            'img': function (type) {
                return type.indexOf('image') !== -1;
            },
            'pdf': function (type) {
                return type.indexOf('pdf') !== -1 || type === 'application/x-download';
            },
            'ppt': function (type) {
                if(MimeTypeUtils.INSTANCE.isPowerpointLike(type, extension)){
                    return true;
                }
                return (type.indexOf('document') !== -1 && type.indexOf('presentation') !== -1) || type.indexOf('powerpoint') !== -1;
            },
            'txt': function (type) {
                return (MimeTypeUtils.INSTANCE.isTxtLike(type, extension));
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
    private filtered: boolean = false;
    private sorted: boolean = false;
    private sortFunction: (el1: Element, el2: Element) => number;
    private cacheSortedDocuments: Element[] = null;
    constructor(public folder: Element = emptyFolder()) {
        this.setFolder(folder);
    }
    private clearCache():void{
        this.cacheSortedDocuments = null;
    }
    setFolder(f: Element) {
        this.folder = f;
    }
    setDocuments(c: Element[]) {
        this.originalDocuments = c;
        this.clearCache();
    }
    setFilter(all: Element[]) {
        this.filteredFolders = all.filter(a => a.eType == FOLDER_TYPE);
        this.filteredDocuments = all.filter(a => a.eType == FILE_TYPE);
        this.filtered = true;
        this.clearCache();
    }
    applyFilter(filter: (el: Element) => boolean) {
        this.filteredDocuments = this.originalDocuments.filter(filter);
        this.filteredFolders = this.folder.children.filter(filter);
        this.filtered = true;
        this.clearCache();
    }
    applySort(sort: (el1: Element, el2: Element) => number) {
        this.sortFunction = sort;
        this.sorted = true;
        this.clearCache();
    }
    pushDoc(el: Element) {
        this.originalDocuments = this.originalDocuments.filter(c=>c._id!=el._id);
        this.originalDocuments.push(el)
        this.folder.addDocument(el as Document);
        this.clearCache();
    }
    findDocuments(filter: (el: Element) => boolean) {
        let co = this.originalDocuments.filter(filter);
        return co;
    }
    deleteDocuments(matching: (el: Element) => boolean) {
        this.originalDocuments = this.originalDocuments.filter(el => !matching(el));
        this.folder.removeDocument(matching);
        this.clearCache();
        return this.originalDocuments;
    }
    restore() {
        this.filtered = false;
        this.clearCache();
    }
    get documents() {
        return this.filtered ? this.filteredDocuments : this.originalDocuments;
    }
    get folders() {
        return this.filtered ? this.filteredFolders : this.folder.children;
    }
    get all() {
        return [...this.folders, ...this.documents];
    }
    get sortedDocuments() {
        if(!this.cacheSortedDocuments){
            this.cacheSortedDocuments = this.sorted ? this.documents.slice(0).sort(this.sortFunction) : this.documents;
        }
        return this.cacheSortedDocuments;
    }
    get sortedFolders() {
        return this.sorted ? this.folders.slice(0).sort(this.sortFunction) : this.folders;
    }
    get sortedAll() {
        return [...this.sortedFolders, ...this.sortedDocuments];
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

export class ElementTree extends Element implements Tree{
    constructor(enableCache:boolean, private tree:Tree){
        super();
        if(!enableCache){
            this.cacheChildren.disableCache();
            this.cacheDocument.disableCache();
        }
        this.children = this.tree.children;
        this.name = this.tree.name;
        this._isShared = this.tree.filter == "shared";
    }
    get hidden() { return this.tree.hidden}
    get filter() { return this.tree.filter}
    get hierarchical() { return this.tree.hierarchical}
    get helpbox() { return this.tree.helpbox}
    get buttons() { return this.tree.buttons}
    get contextualButtons() { return this.tree.contextualButtons}
}