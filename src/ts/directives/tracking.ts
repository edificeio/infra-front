import { Directive, ng } from "../ng-start";
import { EditTrackingEvent } from '../tracking';

export const trackInputEventDirective: Directive = ng.directive('trackInputEvent', ['$parse', ($parse) => {
    return {
        restrict: 'A',
        require: ['?ngModel'],
        link: function (scope, element, attrs, requires) {
            const ngModel = requires[0];
            const model: EditTrackingEvent = $parse(attrs.trackInputEvent)(scope);
            if (element[0].tagName == "EDITOR") {
                //editor track model to view change
                let oldValue: string;
                ngModel && ngModel.$formatters.push(function (e) {
                    if (!oldValue) oldValue = e;
                    const copy = e.replaceAll(" class=\"ng-scope\"", "");
                    if (e != oldValue && copy != oldValue) {
                        model.onStart(true);
                        oldValue = e;
                    }
                    return e
                })
            } else {
                //track view to model change
                ngModel && ngModel.$parsers.push(function (e) {
                    model.onStart(true);
                    return e
                })
            }
        },
    };
}]);