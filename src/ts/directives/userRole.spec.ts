import { userMissingRole, userRole } from './userRole';
import { model } from '../modelDefinitions';
import { module, injector } from 'angular';
import { Directive } from '../ng-start';

const testingModule = 'userRoleTestingModule';

abstract class AbstractUserRoleBuilder {
    protected readonly abstract directiveAttribute: string;
    private role = 'aRole';

    constructor(private $compile, private $rootScope) {
    }

    withRole(role: string): AbstractUserRoleBuilder {
        this.role = role;
        return this;
    }

    value() {
        const element = this.$compile(`<div ${this.directiveAttribute}='${this.role}'></div>`)(this.$rootScope);
        this.$rootScope.$digest();
        return element;
    }
}

class UserRoleElementBuilder extends AbstractUserRoleBuilder {
    protected readonly directiveAttribute = 'user-role';
}

class UserMissingRoleElementBuilder extends AbstractUserRoleBuilder {
    protected readonly directiveAttribute = 'user-missing-role';
}

class MeBuilder {
    private functions: { [key: string]: boolean } = {};

    withRole(r: string): MeBuilder {
        this.functions[r] = true;
        return this;
    }

    value(): any {
        return {functions: this.functions};
    }
}

interface Injector {
    get(token: string): any
}

class TestingModuleInitializer {
    private module: any;

    constructor(private moduleName) {
        this.module = module(moduleName, []);
    }

    withDirective(directive: Directive): TestingModuleInitializer {
        this.module.directive(directive.name, directive.contents);
        return this;
    }

    getInjector(): Injector {
        return injector(['ng', this.moduleName]);
    }
}

describe('userRole', function () {
    let $compile,
        $rootScope;

    beforeEach(() => {
        const inj = new TestingModuleInitializer(testingModule)
            .withDirective(userRole)
            .getInjector();
        $rootScope = inj.get('$rootScope');
        $compile = inj.get('$compile');
    });

    it(`should hide the element when
                    the current user has only the 'anotherRole' role
                    and the attribute 'userRole' is 'aRole'`, function () {
        model.me = new MeBuilder().withRole('anotherRole').value();
        const element = new UserRoleElementBuilder($compile, $rootScope).withRole('aRole').value();
        expect(element.css('display')).toBe('none');
    });

    it(`should show the element when
                    the current user has the 'aRole' role
                    and the attribute 'userRole' is 'aRole'`, function () {
        model.me = new MeBuilder().withRole('aRole').value();
        const element = new UserRoleElementBuilder($compile, $rootScope).withRole('aRole').value();
        expect(element.css('display')).toBe('block');
    });
});

describe('userMissingRole', function () {
    let $compile,
        $rootScope;

    beforeEach(() => {
        const inj = new TestingModuleInitializer(testingModule)
            .withDirective(userMissingRole)
            .getInjector();
        $rootScope = inj.get('$rootScope');
        $compile = inj.get('$compile');
    });

    it(`should show the element when
                    the current user has only the 'anotherRole' role
                    and the attribute 'userRole' is 'aRole'`, function () {
        model.me = new MeBuilder().withRole('anotherRole').value();
        const element = new UserMissingRoleElementBuilder($compile, $rootScope).withRole('aRole').value();
        expect(element.css('display')).toBe('block');
    });

    it(`should hide the element when
                    the current user has the 'aRole' role
                    and the attribute 'userRole' is 'aRole'`, function () {
        model.me = new MeBuilder().withRole('aRole').value();
        const element = new UserMissingRoleElementBuilder($compile, $rootScope).withRole('aRole').value();
        expect(element.css('display')).toBe('none');
    });
});
