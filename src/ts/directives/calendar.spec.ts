import { calendarComponent } from './calendar';
import { injector, module } from 'angular';
import { appPrefix } from '../globals';
import { model } from '../modelDefinitions';

describe('Calendar', function () {
    let $compile,
        $rootScope,
        $timeout,
        $templateCache;

    beforeEach(() => {
        module(testingModule, []).directive(calendarComponent.name, calendarComponent.contents);
        angular.mock.module(testingModule);
        angular.mock.inject(function (_$compile_, _$rootScope_, _$timeout_, _$templateCache_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
            $timeout = _$timeout_;
            $templateCache = _$templateCache_;
        });
        $templateCache.put(`/${appPrefix}/public/template/entcore/calendar.html`, '');
        model.calendar = jasmine.createSpyObj('Calendar', [
            'clearScheduleItems', 'setIncrement', 'initTimeSlots', 'addScheduleItems'
        ]);
    });

    it(`should initialize the 'display' object in the scope`, function () {
        const element = new CalendarComponentElementBuilder($compile, $rootScope, $timeout).value();
        expect(element.scope().display).toEqual({
            readonly: false,
            mode: 'week',
            enableModes: false,
            showQuarterHours: false,
            showQuarterHoursOption: false,
            showNextPreviousButton: false,
            editItem: false,
            createItem: false
        });
    });
});

const testingModule = 'calendarComponentTestingModule';

class CalendarComponentElementBuilder {
    constructor(private $compile, private $rootScope, private $timeout) {
    }

    value() {
        const element = this.$compile(`<calendar></calendar>`)(this.$rootScope, this.$timeout);
        this.$rootScope.$digest();
        return element;
    }
}
