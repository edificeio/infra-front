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
            }else if(element[0].tagName == "IMAGE-SELECT"){
                //imageselect track model to view change
                let oldValue: string|number = -1;
                ngModel && ngModel.$formatters.push(function (e) {
                    if (oldValue == -1) oldValue = e;
                    if (e != oldValue) {
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