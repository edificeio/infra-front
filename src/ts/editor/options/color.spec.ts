import { module } from "angular";
import { backgroundColor, color } from "./color";

class ColorElementBuilder {
    constructor(private $compile, private $rootScope) {
    }

    value() {
        const element = this.$compile(`<color></color>`)(this.$rootScope);
        this.$rootScope.$digest();
        return element;
    }
}

class BackgroundColorElementBuilder {
    constructor(private $compile, private $rootScope) {
    }

    value() {
        const element = this.$compile(`<background-color></background-color>`)(this.$rootScope);
        this.$rootScope.$digest();
        return element;
    }
}

describe('color', () => {
    const testingModule = 'colorTestingModule';

    let $compile,
        $rootScope,
        instance;

    beforeEach(() => {
        instance = jasmine.createSpyObj('Instance', ['on']);
        instance.selection = jasmine.createSpyObj('Selection', ['isEmpty', 'css']);
        const mod = module(testingModule, []);
        mod.directive(color.name, () => color.run(instance));
        angular.mock.module(testingModule);
        angular.mock.inject(function (_$compile_, _$rootScope_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
        });
        spyOn(document, 'queryCommandValue');
    });

    it(`should initialize foreColor at #000000
            when the selection is empty`, () => {
        new ColorElementBuilder($compile, $rootScope).value();
        expect($rootScope.foreColor).toBe('#000000');
    });

    it(`should apply the color #123123 to the selection
            when the input changes to #123123
            and the selection and input color was #000000`, () => {
        instance.selection.isEmpty.and.returnValue(false);
        (document.queryCommandValue as jasmine.Spy).and.returnValue('rgb(0, 0, 0)');
        const element = new ColorElementBuilder($compile, $rootScope).value();
        element.find('input').val('#123123').trigger('change');
        expect(instance.selection.css).toHaveBeenCalledWith({color: '#123123'});
    });
    
});

describe('backgroundColor', () => {
    const testingModule = 'backgroundColorTestingModule';

    let $compile,
        $rootScope,
        instance;

    beforeEach(() => {
        instance = jasmine.createSpyObj('Instance', ['on']);
        instance.selection = jasmine.createSpyObj('Selection', ['isEmpty', 'css']);
        const mod = module(testingModule, []);
        mod.directive(backgroundColor.name, () => backgroundColor.run(instance));
        angular.mock.module(testingModule);
        angular.mock.inject(function (_$compile_, _$rootScope_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
        });
        spyOn(document, 'queryCommandValue');
    });

    it(`should change the color of the button to white
            when the input changes to a dark color (eg: #123123)`, () => {
        const element = new BackgroundColorElementBuilder($compile, $rootScope).value();
        element.find('input').val('#123123').trigger('change');
        expect(element.find('i').css('color')).toBe('rgb(255, 255, 255)');
    });

    it(`should change the color of the button to black
            when the input changes to a light color (eg: #FFC6BD)`, () => {
        const element = new BackgroundColorElementBuilder($compile, $rootScope).value();
        element.find('input').val('#FFC6BD').trigger('change');
        expect(element.find('i').css('color')).toBe('rgb(0, 0, 0)');
    });
});