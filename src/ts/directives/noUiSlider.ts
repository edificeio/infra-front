/*
FROM angularjs-nouislider
 */

import { Directive, ng } from '../ng-start';

const noUiSlider = require('nouislider');

export const noUiSliderDirective: Directive = ng.directive('noUiSlider', ($timeout, $q, $log) => ({
    restrict: 'AE',
    require: '?ngModel',
    scope: {
        created: '&?sliderCreated',
        options: '=?sliderOptions',
    },
    link: (scope, element, attrs, ngModel) => {
        const htmlElement = element[0];
        let options = angular.copy(scope.options);

        /**
         * Extends the API returned by noUiSlider with the `$on` function which wraps the `on` function
         * to use Angular.
         *
         * @param {Object} api The API instance returned by the `noUiSlider.create()` method
         * @return {Object} The API instance with the added `$on` function
         */
        function extendApi(api) {
            api.$on = (eventName, callback) => {
                const wrappedCallback = () => {
                    $timeout(() => {
                        callback(api.get());
                    });
                };

                api.on(eventName, wrappedCallback);

                return () => {
                    api.off(eventName, wrappedCallback);
                };
            };

            return api;
        }

        /**
         * Creates a watcher that calls the function given by the `slider-created` directive attribute.
         * The watcher fires every time the `slider-created` function changes.
         *
         * @param {Object} api The API instance returned by the `noUiSlider.create()` method
         */
        function setCreatedWatcher(api) {
            scope.$watch('created', (newCallback) => {
                if (!angular.isFunction(newCallback)) {
                    return;
                }

                newCallback({api});
            });
        }

        /**
         * Creates a watcher that looks for changes in the `slider-options` directive attribute. When a
         * change is detected the options for the noUiSlider instance are updated. Note that only the
         * 'margin', 'limit', 'step', 'range', 'animate' and 'snap' options can be updated this way (as
         * documented in https://refreshless.com/nouislider/more/#section-update). All other option
         * updates require you to destroy the current instance and create a new one.
         *
         * @param {Object} api The API instance returned by the `noUiSlider.create()` method
         */
        function setOptionsWatcher(api) {
            scope.$watch('options', (newOptions, oldOptions) => {
                if (angular.equals(newOptions, oldOptions)) {
                    return;
                }

                options = angular.copy(scope.options);

                api.updateOptions(options);
            });
        }

        /**
         * Add ngModel controls to the directive. This allows the use of ngModel to set and get the
         * value in the slider. It uses the noUiSlider API's get and set functions, so no custom
         * formatters need to be defined for ngModel. The ngModelOptions can be used.
         *
         * @param {Object} api The API instance returned by the `noUiSlider.create()` method
         */
        function bindNgModelControls(api) {
            ngModel.$render = () => {
                api.set(ngModel.$modelValue);
            };

            api.on('update', () => {
                const positions = api.get();
                ngModel.$setViewValue(positions);
            });
        }

        /**
         * A utility function that returns a promise which resolves when ngModel is correctly loaded,
         * using $timeout.
         *
         * @return {Promise} Returns a promise that resolves with `null` when ngModel is null and thus
         * not in use. If the value entered for ngModel is not an array or number, an error is thrown
         * and thus the promise rejects. If the value entered for ngModel is correct, the promise
         * resolves with this value.
         */
        function initializeNgModel() {
            if (ngModel === null) {
                return $q.resolve(null);
            }

            return $q((resolve) => {
                $timeout(() => {
                    if (!(angular.isArray(ngModel.$modelValue) || angular.isNumber(ngModel.$modelValue))) {
                        throw new Error(`Value provided in ngModel is not a valid noUislider start position. Expected a Number or an Array of Numbers, found: ${ngModel.$modelValue}`);
                    }

                    resolve(ngModel.$modelValue);
                });
            });
        }

        /**
         * Creates a noUiSlider instance.
         */
        function createInstance() {
            const api = extendApi(noUiSlider.create(htmlElement, options));

            setCreatedWatcher(api);
            setOptionsWatcher(api);

            if (ngModel !== null) {
                bindNgModelControls(api);
            }
        }

        // Wait for ngModel to be initialized
        initializeNgModel()
            .then(($modelValue) => {
                if ($modelValue !== null) {
                    // If ngModel is being used, (over)write the start option for the noUiSlider options
                    options.start = $modelValue;
                }

                // Create a noUiSlider instance
                createInstance();
            })
            .catch($log.error);
    },
}));
