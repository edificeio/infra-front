import { Subject, Subscription } from "rxjs";
import { idiom } from "./idiom";

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
}

export const navigationGuardService = {
    _listeners: new Map<INavigationListener, Subscription>(),
    _guards: new Set<INavigationGuard>(),
    registerGuard(guard: INavigationGuard) {
        navigationGuardService._guards.add(guard);
    },
    unregisterGuard(guard: INavigationGuard) {
        navigationGuardService._guards.delete(guard);
    },
    registerListener(listener: INavigationListener) {
        if (navigationGuardService._listeners.has(listener)) {
            return;
        }
        listener.start();
        const sub = listener.onChange.subscribe((navigation) => {
            console.log("CHANGE");
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
        for (const guard of Array.from(navigationGuardService._guards.values())) {
            if (!guard.canNavigate()) {
                const can = confirm(idiom.translate("navigation.guard.text"));
                if (can) {
                    navigation.accept();
                } else {
                    navigation.reject();
                }
                return;
            }
        }
        navigation.accept();
    },
    reset() {
        for (const guard of Array.from(navigationGuardService._guards)) {
            guard.reset();
        }
    }
}

//=== Guards
export class InputGuard<T> implements INavigationGuard {
    reference: T;
    constructor(private currentValue: () => T, private resetter: () => T, private comparator: (a: T, b: T) => boolean = (a: T, b: T) => {
        return a == b;
    }) { }
    reset() {
        this.reference = this.resetter();
    }
    canNavigate(): boolean {
        return this.comparator(this.reference, this.currentValue());
    }
}

//=== Listeners
export class AngularJSRouteChangeListener implements INavigationListener {
    private static _instance: AngularJSRouteChangeListener = null;
    private subscription: () => void = null;
    onChange = new Subject<INavigationInfo>();
    constructor(private $rootScope: any) { }
    start() {
        if (this.subscription) return;
        this.subscription = this.$rootScope.$on("$locationChangeStart", (event, next, current) => {
            console.log("LCS");
            console.log(event, next, current);
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
    start() {}
    stop() {}

    static getInstance() {
        if (TemplateRouteChangeListener._instance == null) {
            TemplateRouteChangeListener._instance = new TemplateRouteChangeListener();
        }
        return TemplateRouteChangeListener._instance;
    }
}