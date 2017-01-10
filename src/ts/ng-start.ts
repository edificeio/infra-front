
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
    requiredModules: string[];

    constructor() {
        this.controllers = [];
        this.directives = [];
        this.filters = [];
        this.requiredModules = [];
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
        this.requiredModules.forEach((m) => {
            module.requires.push(m);
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

    addRequiredModule(moduleName: string) {
        this.requiredModules.push(moduleName);
    }
};

export var ng = new Ng();
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.ng = ng;