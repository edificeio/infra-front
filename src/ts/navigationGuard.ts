import { Subject, Subscription } from "rxjs";
import { idiom } from "./idiom";
import { template } from "./template";
import { LightboxDelegate } from "./directives";


function setToArray<T>(s: Set<T>): T[] {
    const res = [];
    s.forEach(g => res.push(g));
    return res;
}
function mapValuesToArray<KEY, T>(s: Map<KEY, T>): T[] {
    const res: T[] = [];
    s.forEach((value, _) => res.push(value));
    return res;
}
function mapKeysToArray<KEY, T>(s: Map<KEY, T>): KEY[] {
    const res: KEY[] = [];
    s.forEach((_, key) => res.push(key));
    return res;
}
export interface INavigationInfo {
    accept(): void;
    reject(): void;
}

export interface INavigationListener {
    onChange: Subject<INavigationInfo>;
    start(): void;
    stop(): void;
}

export interface INavigationGuard {
    reset(): void;
    canNavigate(): boolean;
    onUserConfirmNavigate?(canNavigate:boolean):void;
}

export const navigationGuardService = {
    debounceMs: 1000, //1000ms
    _lastTime: null,
    _lastResponse: null,
    _listeners: new Map<INavigationListener, Subscription>(),
    _guards: new Map<string, Set<INavigationGuard>>(),

    _id_counter: 0,
    onUserConfirmNavigate: new Array<(canNavigate:boolean)=>void>(),
    generateID(): string {
        return "__auto_guard_id_" + (navigationGuardService._id_counter++);
    },

    _getGuardsMapByID(rootID: string): Set<INavigationGuard> {
        let res = navigationGuardService._guards.get(rootID);
        return res != null ? res : new Set<INavigationGuard>();
    },

    registerGuard(rootID: string, guard: INavigationGuard) {
        let gmap = navigationGuardService._getGuardsMapByID(rootID);
        gmap.add(guard);
        navigationGuardService._guards.set(rootID, gmap);
    },
    unregisterGuard(rootID: string, guard: INavigationGuard) {
        let gmap = navigationGuardService._getGuardsMapByID(rootID);
        gmap.delete(guard);
        if (gmap.size == 0)
            navigationGuardService.unregisterRoot(rootID);
    },
    unregisterRoot(rootID: string) {
        navigationGuardService._guards.delete(rootID);
    },

    registerIndependantGuard(guard: INavigationGuard): string {
        let fakeRoot: string = navigationGuardService.generateID();
        navigationGuardService.registerGuard(fakeRoot, guard);
        return fakeRoot;
    },

    unregisterIndependantGuard(guardID: string): void {
        navigationGuardService.unregisterRoot(guardID);
    },

    registerListener(listener: INavigationListener) {
        if (navigationGuardService._listeners.has(listener)) {
            return;
        }
        listener.start();
        const sub = listener.onChange.subscribe((navigation) => {
            navigationGuardService.tryNavigate(navigation);
        });
        navigationGuardService._listeners.set(listener, sub);
    },
    unregisterListener(listener: INavigationListener) {
        const sub = navigationGuardService._listeners.get(listener);
        if (sub) {
            sub.unsubscribe();
            listener.stop();
            navigationGuardService._listeners.delete(listener);
        }
    },
    tryNavigate(navigation: INavigationInfo) {
        //debounce
        const lastTime = navigationGuardService._lastTime || 0;
        const currentTime = new Date().getTime();
        const duration = currentTime - lastTime;
        const lastResponse = navigationGuardService._lastResponse;
        if (lastResponse != null && duration < navigationGuardService.debounceMs) {
            if (lastResponse) navigation.accept();
            else navigation.reject();
            return;
        }
        //try navigate
        for (const root of mapValuesToArray(navigationGuardService._guards)) {
            for (const guard of setToArray(root)) {
                if (!guard.canNavigate()) {
                    const can = confirm(idiom.translate("navigation.guard.text"));
                    for(const cb of navigationGuardService.onUserConfirmNavigate){
                        cb(can);
                    }
                    guard.onUserConfirmNavigate && guard.onUserConfirmNavigate(can);
                    navigationGuardService._lastTime = new Date().getTime();
                    navigationGuardService._lastResponse = can;
                    if (can) {
                        navigation.accept();
                        navigationGuardService.resetAll();//reset all guards on navigate
                    } else {
                        navigation.reject();
                    }
                    return;
                }
            }
        }
        navigation.accept();
    },
    reset(rootID: string) {
        const guards = setToArray(navigationGuardService._getGuardsMapByID(rootID));
        for (const guard of guards) {
            guard.reset();
        }
    },
    resetAll() {
        for (const id of mapKeysToArray(navigationGuardService._guards))
            navigationGuardService.reset(id);
    }
}

//=== Guards
export class InputGuard<T> implements INavigationGuard {
    reference: T;
    constructor(private currentValue: () => T, private resetter: () => T, private comparator: (a: T, b: T) => boolean = (a: T, b: T) => {
        return a == b;
    }) { this.reset(); }
    unNaN(val) {
        return typeof val == "number" && isNaN(val) == true ? null : val;
    }
    reset() {
        this.reference = this.resetter();
    }
    canNavigate(): boolean {
        return this.comparator(this.unNaN(this.reference), this.unNaN(this.currentValue()));
    }
}

export interface IObjectGuardDelegate {
    guardObjectIsDirty(): boolean;
    guardObjectReset(): void;
    guardOnUserConfirmNavigate?(canNavigate:boolean):void;
}

export class ObjectGuard implements INavigationGuard {
    constructor(private currentValue: () => IObjectGuardDelegate) { }
    reset() {
        this.currentValue().guardObjectReset();
    }
    canNavigate(): boolean {
        return !this.currentValue().guardObjectIsDirty();
    }
    onUserConfirmNavigate(canNavigate:boolean):void{
        const tmp = this.currentValue();
        tmp.guardOnUserConfirmNavigate && tmp.guardOnUserConfirmNavigate(canNavigate);
    }
}

//=== Listeners
export class AngularJSRouteChangeListener implements INavigationListener {
    private static _instance: AngularJSRouteChangeListener = null;
    private subscription: () => void = null;
    onChange = new Subject<INavigationInfo>();
    constructor(private $rootScope: any) {
        let self = this;
        $rootScope.$on("$destroy", function () {
            navigationGuardService.unregisterListener(self);
        });
    }
    start() {
        if (this.subscription) return;
        this.subscription = this.$rootScope.$on("$locationChangeStart", (event, next, current) => {
            //should be synchronous
            this.onChange.next({
                accept() { },
                reject() {
                    event.preventDefault();
                }
            })
        });
    }
    stop() {
        this.subscription && this.subscription();
        this.subscription = null;
    }
    static getInstance($rootScope: any) {
        if (AngularJSRouteChangeListener._instance == null) {
            AngularJSRouteChangeListener._instance = new AngularJSRouteChangeListener($rootScope);
        }
        return AngularJSRouteChangeListener._instance;
    }
}

export class DOMRouteChangeListener implements INavigationListener {
    private static _instance: DOMRouteChangeListener = null;
    onChange = new Subject<INavigationInfo>();
    private callback() {
        let result = null;
        //should be synchronous
        this.onChange.next({
            accept() {
                result = true;
            },
            reject() {
                event.preventDefault();
                event.returnValue = false;
                result = false;
            }
        })
        return result;
    }
    private boundCallback = null;
    start() {
        this.boundCallback = this.callback.bind(this);
        window.addEventListener("beforeunload", this.boundCallback, false);
    }
    stop() {
        window.removeEventListener("beforeunload", this.boundCallback);
    }

    static getInstance() {
        if (DOMRouteChangeListener._instance == null) {
            DOMRouteChangeListener._instance = new DOMRouteChangeListener();
        }
        return DOMRouteChangeListener._instance;
    }
}

export class TemplateRouteChangeListener implements INavigationListener {
    private static _instance: TemplateRouteChangeListener = null;
    onChange = new Subject<INavigationInfo>();
    private defaultTrigger = true;
    private containerNotTriggering: string[] = [];
    private containerTriggering: string[] = [];
    start() {
        const self = this;
        template.setDelegate({
            tryOpen(args) {
                self.tryOpen(args.name, args.success, args.reject);
            }
        });
    }
    stop() {
        template.removeDelegate();
    }
    setTriggerByDefault(trigger: boolean) {
        this.defaultTrigger = trigger;
    }
    private triggerNavigation(name: string): boolean {
        for (let i = this.containerTriggering.length; i-- > 0;) {
            if (this.containerTriggering[i] == name) {
                return true;
            }
        }
        for (let i = this.containerNotTriggering.length; i-- > 0;) {
            if (this.containerNotTriggering[i] == name) {
                return false;
            }
        }
        return this.defaultTrigger;
    }
    tryOpen(containerName: string, openCb: () => void, rejectCb: () => void) {
        if (this.triggerNavigation(containerName)) {
            this.onChange.next({
                accept: openCb,
                reject: rejectCb
            });
        } else {
            openCb();
        }
    }
    addIgnoreContainer(name: string) {
        this.containerNotTriggering.push(name);
    }
    removeIgnoreContainer(name: string) {
        this.containerNotTriggering = this.containerNotTriggering.filter(n => n != name);
    }
    addTriggerContainer(name: string) {
        this.containerTriggering.push(name);
    }
    removeTriggerContainer(name: string) {
        this.containerTriggering = this.containerTriggering.filter(n => n != name);
    }
    static getInstance() {
        if (TemplateRouteChangeListener._instance == null) {
            TemplateRouteChangeListener._instance = new TemplateRouteChangeListener();
        }
        return TemplateRouteChangeListener._instance;
    }
}

export class ManualChangeListener implements INavigationListener {
    onChange = new Subject<INavigationInfo>();
    start() { }
    stop() {
        this.onChange.unsubscribe();
    }
}


export class LightboxChangeListener implements INavigationListener,LightboxDelegate {
    onChange = new Subject<INavigationInfo>();
    start() { }
    stop() {
        this.onChange.unsubscribe();
    }
	stayOpen():Promise<boolean>{
		return new Promise((resolve,reject)=>{
			this.onChange.next({
				accept(){
					resolve(false);
				},
				reject(){
					resolve(true);
				}
			})
		});
	}
}

if (!window.entcore) {
    window.entcore = {};
}
window.entcore.navigationGuardService = navigationGuardService;
window.entcore.ObjectGuard = ObjectGuard;