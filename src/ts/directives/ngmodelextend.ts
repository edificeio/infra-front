import { ng } from '../ng-start';

export type NgModelExtend = {
    onInit?: (ngModel) => void
    onValidationChanged?: (ngModel: any) => void;
    clearParsers?: boolean
    clearFormatters?: boolean
    formatters?: Array<(val: any) => string>
    parsers?: Array<(val: string) => any>
    validators?: Array<{ key: string, validator: (modelValue: any, viewValue: string) => boolean }>
};
interface NgModelExtendScope {
    input: any
    ngModelExtend: NgModelExtend
    $watch: any
}
export const ngModelExtend = ng.directive("ngModelExtend", ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        require: "ngModel",
        scope: {
            ngModelExtend: "="
        },
        compile: function (element, attrs) {
            const link = function (scope: NgModelExtendScope, element, attr, ngModel) {
                scope.input = ngModel;
                const init = () => {
                    const { formatters = [], parsers = [], validators = [], clearFormatters = false, clearParsers = false, onValidationChanged = (_) => { }, onInit = (_) => { } } = scope.ngModelExtend || {};
                    scope.$watch('input.$valid', () => onValidationChanged(ngModel))
                    let changed = false;
                    if (clearFormatters) {
                        ngModel.$formatters = [];
                        changed = true;
                    }
                    if (clearParsers) {
                        ngModel.$parsers = [];
                        changed = true;
                    }
                    parsers.forEach(p => {
                        ngModel.$parsers.push(p);
                        changed = true;
                    });
                    formatters.forEach(p => {
                        ngModel.$formatters.push(p);
                        changed = true;
                    });
                    validators.forEach(p => {
                        ngModel.$validators[p.key] = p.validator
                        changed = true;
                    });
                    changed && ngModel.$render();
                    onInit(ngModel);
                }
                init();
            }
            return link;
        }
    };
}])