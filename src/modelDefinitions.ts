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
	
}

export class BaseModel extends Model{
	me: any;
	calendar: any;
	mediaLibrary: any;
	
	build(){
		
	}
}

Model.prototype.build = function(){};
(window as any).Model = Model;
export var model = new BaseModel();
(window as any).model = model;

export class Collection<T>{
	all: T[];
	obj: any;
	callbacks: {};
	
	constructor(obj: T){
		this.all = [];
		this.obj = obj;
		this.callbacks = {};
		this.sync = function(){
			
		}
	}
}

export declare interface Collection<T>{
	sync: () => void | string;
	composer?: any;
	model?: any;
	on(eventName: string, cb: () => void);
	one(eventName: string, cb: () => void);
	trigger(eventName: string);
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
	slice(index: number, nbItems: number);
	push(item: T, refreshView?: boolean);
	remove(item: T, refreshView?: boolean);
	removeAt(index: number);
	insertAt(index: number, item: T);
	moveUp(item: T);
	moveDown(item: T);
	getIndex(item: T);
	splice(...args: any[]);
	selectItem(item: T);
	selection(): T[];
	removeSelection();
	addRange(data: T[], cb?: (item: T) => void, refreshView?: boolean);
	load(data: T[], cb?: (item: T) => void, refreshView?: boolean);
	empty();
	length(): number;
	request(httpMethod: string, path: string, cb?: (result: any) => void);
	contains(item: T);
	last(): T;
	removeAll();
}