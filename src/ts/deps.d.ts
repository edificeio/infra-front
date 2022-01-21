// angular is loaded globally
declare let angular;

//webpack stuff
declare function require(path:string);

declare interface require{
    ensure(modulesPaths: string[], cb: (modules) => void);
}

// allow parsing strings as int
declare function parseInt(data:any, radix?:number);

declare interface Range{
    intersectsNode(item: HTMLElement): boolean;
}

declare interface Blob{
    name: string;
}

declare interface Document{
    caretRangeFromPoint(x: number, y: number);
    caretPositionFromPoint(x: number, y: number);
}

declare interface Xiti {
    conf: any;
    ATInternet: any;
    ATTag: any;
    structure: any;
    run(path?: string): Promise<void>;
    click(name: string, element: Element): Promise<void>;
}

declare interface Window{
    MathJax: any;
    Prism: any;
    entcore: any;
    html_beautify: any;
    jQuery: any;
    notLoggedIn: boolean;
    xiti: Xiti;
}

declare interface Node{
    innerHTML: string;
}

declare interface Object{
    toJSON(): string | {}
}