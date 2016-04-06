export declare var template: {
    viewPath: string;
    containers: {};
    open: (name: any, view: any) => void;
    contains: (name: any, view: any) => boolean;
    isEmpty: (name: any) => boolean;
    close: (name: any) => void;
    watch: (container: any, fn: any) => void;
};
export declare var notify: {
    message: (type: any, message: any) => void;
    error: (message: any) => void;
    info: (message: any) => void;
    success: (message: any) => void;
};
