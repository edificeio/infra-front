import { module } from "angular";
import { subscript, superscript } from "./subscript";

interface EditorDirective {
    name: string;
    run: (instance: any) => any;
}

class AnyScriptElementBuilder {
    constructor(private $compile, private $rootScope, private directiveName) {
    }

    value() {
        const element = this.$compile(`<${this.directiveName}></${this.directiveName}>`)(this.$rootScope);
        this.$rootScope.$digest();
        return element;
    }
}

function returnWhenArg(spy: jasmine.Spy, argument: string, result: any, throwError = true) {
    spy.and.callFake(function (arg: any) {
        if (arg === argument) {
            return result;
        }
        if (throwError) {
            throw new Error('unexpected arg');
        }
    });
}

function generateTestSuite(directiveName: string, propertyName: string, editorDirective: EditorDirective) {
    describe(`${directiveName}`, () => {
        const testingModule = `${directiveName}TestingModule`;

        let $compile,
            $rootScope,
            instance;

        beforeEach(() => {
            instance = jasmine.createSpyObj('Instance', ['on', 'focus']);
            instance.editZone = jasmine.createSpyObj('jQuery', ['is']);
            instance.selection = jasmine.createSpyObj('Selection', ['isEmpty', 'css']);
            const mod = module(testingModule, []);
            mod.directive(editorDirective.name, () => editorDirective.run(instance));
            angular.mock.module(testingModule);
            angular.mock.inject(function (_$compile_, _$rootScope_) {
                $rootScope = _$rootScope_;
                $compile = _$compile_;
            });
        });

        describe('on click', () => {
            it('should focus the editor instance when it is not focused', () => {
                returnWhenArg(instance.editZone.is, ':focus', false);
                const element = new AnyScriptElementBuilder($compile, $rootScope, directiveName).value();
                element.click();
                expect(instance.focus).toHaveBeenCalled();
            });

            it('should not focus the editor instance when it is already focused', () => {
                returnWhenArg(instance.editZone.is, ':focus', true);
                const element = new AnyScriptElementBuilder($compile, $rootScope, directiveName).value();
                element.click();
                expect(instance.focus).not.toHaveBeenCalled();
            });

            it(`should add the 'toggled' class and set selection css to vertical-align ${propertyName} and font-size: 12px
                when the selection has the css property vertical-align is not equal to ${propertyName}`, () => {
                returnWhenArg(instance.selection.css, 'vertical-align', 'middle', false);
                const element = new AnyScriptElementBuilder($compile, $rootScope, directiveName).value();
                element.click();
                expect(element.hasClass('toggled')).toBe(true);
                expect(instance.selection.css.calls.mostRecent().args[0]).toEqual({
                    'vertical-align': propertyName,
                    'font-size': '12px'
                });
            });

            it(`should remove the 'toggled' class and remove selection css properties vertical-align and font-size
                when the selection has the css property vertical-align equals to ${propertyName}`, () => {
                returnWhenArg(instance.selection.css, 'vertical-align', `${propertyName}`, false);
                const element = new AnyScriptElementBuilder($compile, $rootScope, directiveName).value();
                element.click();
                expect(element.hasClass('toggled')).toBe(false);
                expect(instance.selection.css.calls.mostRecent().args[0]).toEqual({
                    'vertical-align': '',
                    'font-size': ''
                });
            });
        });

        describe(`on 'instancechange' event`, () => {
            it(`should add the 'toggled' class
            when the selection has the css property vertical-align equals to ${propertyName}`, () => {
                returnWhenArg(instance.selection.css, 'vertical-align', propertyName);
                const element = new AnyScriptElementBuilder($compile, $rootScope, directiveName).value();
                const selectionChangeListener = instance.on.calls.mostRecent().args[1];
                selectionChangeListener();
                expect(element.hasClass('toggled')).toBe(true);
            });

            it(`should remove the 'toggled' class
            when the selection has the css property vertical-align is not equal to sub`, () => {
                returnWhenArg(instance.selection.css, 'vertical-align', 'middle');
                const element = new AnyScriptElementBuilder($compile, $rootScope, directiveName).value();
                const selectionChangeListener = instance.on.calls.mostRecent().args[1];
                selectionChangeListener();
                expect(element.hasClass('toggled')).toBe(false);
            });
        });
    });
}

generateTestSuite('subscript', 'sub', subscript);
generateTestSuite('superscript', 'super', superscript);
