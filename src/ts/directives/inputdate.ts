import { ng, idiom as lang, moment } from '../entcore';
import { Subject, Observable } from 'rxjs';
import { NgModelExtend } from './ngmodelextend';

interface DateInputScope {
    ngModelExtend: NgModelExtend

    isDateSupported: boolean
    dateFormat: string
    dateFormatI18: string
    current: { model: string }//ISO Date

    onChange: () => void
    //
    ngRequired: boolean,
    ngChange: Function,
    ngModel: any,
    ngModelOptions: any,
    ngMax: Date | string,//date or iso date
    ngMin: Date | string,//date or iso date
    class: string
    onSuccess?()
    //
    $on: any
    $watch: any
}
export const inputdate = ng.directive("inputdate", ['$timeout', function ($timeout) {
    return {
        restrict: 'E',
        template: `
            <input type="date" class="[[class]]"  
                ng-model="current.model" 
                ng-model-options="ngModelOptions || {}" 
                ng-model-extend="ngModelExtend"
                ng-required="ngRequired" />
        `,
        scope: {
            ngRequired: "=",
            ngChange: "=",
            ngModel: "=",
            ngModelOptions: "=",
            ngMax: "@",
            ngMin: "@",
            class: "@",
            onSuccess: "&"
        },
        compile: function (element, attrs) {
            const isDateSupported = (function () {
                const input = document.createElement('input');
                const value = 'a';
                input.setAttribute('type', 'date');
                input.setAttribute('value', value);
                return (input.value !== value);
            })();
            const input = element.find("input");
            const format: string = isDateSupported ? moment().creationData().locale._longDateFormat.L : "DD/MM/YYYY";
            if (!isDateSupported) {
                input[0].setAttribute("type", "text");
                input[0].setAttribute("placeholder", "[[dateFormatI18]]");
            }
            const link = function (scope: DateInputScope, element, attr) {
                // === Init private fields
                let _ngModel = null;
                const onChange = new Subject<boolean>()
                // === Init fields
                scope.isDateSupported = isDateSupported;
                scope.dateFormat = format;
                scope.dateFormatI18 = lang.translate("date." + format)
                // === Init listeners
                const sub = (onChange as Observable<boolean>).debounceTime(400).subscribe((valid) => {
                    if (attr.onSuccess) {
                        valid && scope.onSuccess();
                    }
                });
                scope.$on("destroy", () => {
                    //wait debounce to finish
                    setTimeout(() => {
                        sub.unsubscribe();
                    }, 500)
                })
                // === Private methods
                const dateOrISOToMoment = (val: Date | string) => {
                    if (val instanceof Date) {
                        return moment(val);
                    } else if (typeof val == "string") {
                        return moment(val, "YYYY-MM-DD", true);
                    } else {
                        return null;
                    }
                }
                const formatOrISOToMoment = (val: Date | string) => {
                    if (typeof val == "string") {
                        return moment(val, ["YYYY-MM-DD", format], true);
                    } else {
                        return null;
                    }
                }
                // === Extend model:
                // Parse to an ISO Date
                // Format to a local format (input text) or ISO Date (input date)
                scope.ngModelExtend = {
                    clearParsers: true,
                    clearFormatters: true,
                    formatters: [
                        (val) => {
                            const value = dateOrISOToMoment(val);
                            if (value && value.isValid()) {
                                return isDateSupported ? value.format("YYYY-MM-DD") : value.format(format);
                            }
                            return "";
                        }
                    ],
                    parsers: [
                        (val) => {
                            //always a string
                            const value = formatOrISOToMoment(val);
                            if (value && value.isValid()) {
                                return value.format("YYYY-MM-DD");
                            }
                            return val;
                        },
                        (val) => {
                            setTimeout(() => scope.onChange())
                            return val;
                        }
                    ],
                    validators: [
                        {
                            key: "dateFormat",
                            validator: (model, view) => {
                                //ignore if empty (require will check if it need to be non empty)
                                if (!view) return true;
                                const value = formatOrISOToMoment(view);
                                return value && value.isValid();
                            }
                        },
                        {
                            key: "dateMax",
                            validator: (model, view) => {
                                if (scope.ngMax) {
                                    const value = dateOrISOToMoment(model);
                                    const ngMax = dateOrISOToMoment(scope.ngMax);
                                    if (value && value.isValid() && ngMax && ngMax.isValid()) {
                                        return value.toDate().getTime() <= ngMax.toDate().getTime();
                                    }
                                }
                                return true;
                            }
                        },
                        {
                            key: "dateMin",
                            validator: (model, view) => {
                                if (scope.ngMin) {
                                    const value = dateOrISOToMoment(model);
                                    const ngMin = dateOrISOToMoment(scope.ngMin);
                                    if (value && value.isValid() && ngMin && ngMin.isValid()) {
                                        return value.toDate().getTime() >= ngMin.toDate().getTime();
                                    }
                                }
                                return true;
                            }
                        }
                    ],
                    onInit(ngModel) {
                        _ngModel = ngModel;
                    }
                }
                // ===Init model
                scope.current = {
                    get model() {
                        return scope.ngModel;
                    },
                    set model(s) {
                        scope.ngModel = s;
                    }
                }
                scope.onChange = function () {
                    onChange.next(_ngModel.$valid);
                    if (attr.ngChange) {
                        scope.ngChange()
                    }
                }
            }
            return { pre: link };
        }
    };
}])