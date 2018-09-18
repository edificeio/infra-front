import { userMissingRole, userRole } from './userRole';
import { model } from '../modelDefinitions';
import { module, injector } from 'angular';

const testingModule = 'userRoleTestingModule';

abstract class AbstractUserRoleElementBuilder {
    protected readonly abstract directiveAttribute: string;
    private role = 'aRole';

    constructor(private $compile, private $rootScope) {
    }

    withRole(role: string): AbstractUserRoleElementBuilder {
        this.role = role;
        return this;
    }

    value() {
        const element = this.$compile(`<div ${this.directiveAttribute}='${this.role}'></div>`)(this.$rootScope);
        this.$rootScope.$digest();
        return element;
    }
}

class UserRoleElementBuilder extends AbstractUserRoleElementBuilder {
    protected readonly directiveAttribute = 'user-role';
}

class UserMissingRoleElementBuilder extends AbstractUserRoleElementBuilder {
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

describe('userRole', function () {
    let $compile,
        $rootScope;

    beforeEach(() => {
        module(testingModule, []).directive(userRole.name, userRole.contents);
        angular.mock.module(testingModule);
        angular.mock.inject(function(_$compile_, _$rootScope_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
        })
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
        module(testingModule, []).directive(userMissingRole.name, userMissingRole.contents);
        angular.mock.module(testingModule);
        angular.mock.inject(function(_$compile_, _$rootScope_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
        })
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
