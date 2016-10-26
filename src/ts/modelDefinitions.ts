import { appPrefix, infraPrefix } from './globals';

export class Controller {
    name: string;
    contents: any[];

    constructor(name: string, contents: any[]) {
        this.name = name;
        this.contents = contents;
    }
}

export class Directive {
    name: string;
    contents: any;

    constructor(name: string, contents: any) {
        this.name = name;
        this.contents = contents;
    }
}

export class Filter {
    name: string;
    contents: any;

    constructor(name: string, contents: any) {
        this.name = name;
        this.contents = contents;
    }
}

export class Ng {
    controllers: Controller[];
    directives: Directive[];
    filters: Filter[];

    constructor() {
        this.controllers = [];
        this.directives = [];
        this.filters = [];
    }

    init(module) {
        this.directives.forEach((dir) => {
            module.directive(dir.name, dir.contents);
        });
        this.controllers.forEach((ctrl) => {
            module.controller(ctrl.name, ctrl.contents);
        });
        this.filters.forEach((fil) => {
            module.filter(fil.name, fil.contents);
        });
    }

    directive(name: string, contents: any): Directive {
        return new Directive(name, contents);
    }

    controller (name: string, contents: any[]): Controller {
        return new Controller(name, contents);
    }

    filter(name: string, contents: any): Filter {
        return new Filter(name, contents);
    }
};

export var ng = new Ng();
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.ng = ng;

export declare interface IModel{
	api: { get?: string, put?: string, post?: string, delete?: string }
}

export class Model {
	constructor(data:any = undefined){
		if(typeof this.updateData === 'function'){
			this.updateData(data, false);
		}
    }
}

export declare interface Model{
	build();
	updateData(data: any, refreshView?: boolean);
	makeModel(ctr: any, mixin?: any, namespace?: any);
	makeModels(ctrList: any[] | any);
	sync();
	saveModifications();
	create();
	save();
	remove();
	models: Model[];
	collection(ctr: any, mixin?: any);
	on(eventName: string, callback: () => void);
	unbind(eventName: string, callback: () => void);
	one(eventName: string, callback: () => void);
	trigger(eventName: string, eventData?: any);
	behaviours(serviceName: string);
    inherits(target: any, prototypeFn: any);
    selected: boolean;
}

Model.prototype.build = function () { };

export class BaseModel extends Model{
	me: any;
    calendar: any;
    widgets: any;
	mediaLibrary: any;
	
	build(){
		
	}
}

export var model = new BaseModel();

export class Collection<T>{
	all: T[];
	obj: any;
	callbacks: {};
	
	constructor(obj: any){
		this.all = [];
		this.obj = obj;
		this.callbacks = {};
		this.sync = function(){
			
		}
	}
}

export declare interface Collection<T>{
	sync: any;
	composer: any;
	model?: any;
	on(eventName: string, cb: () => void);
	one(eventName: string, cb: () => void);
	trigger: (eventName: string) => void;
	unbind(eventName: string, callback: () => void);
    forEach(callback: (item: T) => void);
    first(): T;
    select(predicate: (item: T) => boolean);
    deselect(predicate: (item: T) => boolean);
    selectAll();
    deselectAll();
	concat(col: Collection<T>);
	closeAll();
	current: T;
	setCurrent(item: T);
    map: (filter: (item: T) => T) => void;
    filter: (filter: (item: T) => boolean) => T[];
	reject: (filter: (item: T) => boolean) => T[];
    findWhere: (filter: any) => T;
    find: (filter: (item: T) => boolean) => T;
    where: (filter: any) => T[];
	slice(index: number, nbItems: number);
	push: (item: T, refreshView?: boolean) => void;
	remove(item: T, refreshView?: boolean);
	removeAt(index: number);
	insertAt(index: number, item: T);
	moveUp(item: T);
	moveDown(item: T);
	getIndex(item: T);
    indexOf?: (item: T) => number;
	splice(...args: any[]);
	selectItem(item: T);
	selection: () => T[];
	removeSelection: () => void;
	addRange: (data: T[], cb?: (item: T) => void, refreshView?: boolean) => void;
	load: (data: T[], cb?: (item: T) => void, refreshView?: boolean) => void;
	empty: () => void;
	length(): number;
	request(httpMethod: string, path: string, cb?: (result: any) => void);
	contains(item: T);
	last(): T;
	removeAll();
}

if (!window.entcore) {
    window.entcore = {};
}
window.entcore.model = model;

window.entcore.Model = Model;
(window as any).Model = Model;
window.entcore.Collection = Collection;
