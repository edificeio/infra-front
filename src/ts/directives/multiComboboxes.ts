import { ng, _, idiom as lang, $ } from '../entcore';

/**
 * @description Filter with multiple checkboxes.
 * @param ngModel An array of strings containing all the types selected (null if all selected).
 * @param options An array of all the possible option to check. Each option must contain a label and type field.
 * @param titleAll A string representing what should be displayed when all the options are selected.
 * @param title A string reprensenting the begining of what to display when several options are selected.
 * @example
 *  <multi-comboboxes 
        ng-model="<ngModel>"
        options="<options>"
        title-all="<titleAll>"
        title="<title>">
    </multi-comboboxes>
 */

export const multiComboboxes = ng.directive('multiComboboxes', () => {
    return {
        restrict: 'E',
        template: `
            <div class="fluid row">
                <button type="button" class="select-button left-text low-text row" ng-class="{ selected : showOptions }">
                    <span ng-if="ngModel.length === 0" class="block cell-ellipsis right-spacing">[[ titleAll ]]</span>
                    <span ng-if="ngModel.length > 0" class="block cell-ellipsis right-spacing active">[[ title ]]: [[ ngModel.length ]] <i18n>portal.selected</i18n></span> <i class="sort horizontal-margin top-spacing absolute-magnet"/>
                </button>
                <article class="absolute-w">
                    <div class="search-pagination flex-row align-center">
                        <div class="cell twelve">
                            <input class="twelve" name="searchField" type="text" ng-model="searchField"
                                i18n-placeholder="portal.searching" autocomplete="off"/>
                            <i class="search"></i>
                        </div>
                    </div>
                    <div class="top-spacing-twice left-text smaller-text">
                        <a class="text-underline-hover" ng-click="selectNone()"><i18n>portal.none</i18n></a> <span class="horizontal-margin-small">|</span> <a class="text-underline-hover" ng-click="selectAll()"><i18n>portal.all</i18n></a>
                    </div>
                    <div class="top-spacing-twice left-text scroll-seven-checks" bottom-scroll="updatingMaxItems()">
                        <div class="flex-row top-spacing" ng-repeat="option in options | orderBy:'label' | filter:filterByLabel" ng-click="option.checked=!option.checked">
                            <label class="cell wrapping-checkbox">
                                <input type="checkbox" ng-model="option.checked" />
                                <i18n></i18n>
                            </label>
                            <i18n class="cell multiline-ellipsis-two top-spacing size-auto left-text low-importance">[[ option.label ]]</i18n>
                        </div>
                    </div>
                </article>
            </div>
        `,

        scope: {
            ngModel: '=',
            options: '='
        },

        link: (scope, element, attributes) => {
            scope.titleAll = attributes.titleAll;
            scope.title = attributes.title;
            scope.maxItems = 20;
            scope.showOptions = false;
            scope.firstShow = true;
            element.find('article').hide();

            scope.updatingMaxItems = function() {
                scope.maxItems += 20;
            };

            // When options are available, run !
            scope.$watchCollection("options", function(newValue) {
                scope.options.forEach(option => {
                    option.checked = scope.ngModel ? scope.ngModel.indexOf(option.type) !== -1 : true;

                    scope.$watch(function() { return option; }, function(newValue, oldValue) {
                        if (newValue != oldValue) {
                            if (newValue.checked) {
                                    scope.ngModel.push(newValue.type);
                            }
                            else {
                                scope.ngModel.splice(scope.ngModel.indexOf(newValue.type), 1);
                            }
                        }
                    }, true);                 
                });
            });

            scope.searchField = "";

            // Show / Hide the options on click
            var hide = function() {
                element.find('article').css('opacity', 0);
                element.find('article').css('z-index', -1);
                scope.searchField = "";
            };
            element.find('button').on('click', function() {
                if (scope.showOptions) {
                    hide();
                }
                else {
                    if (scope.firstShow) {
                        element.find('article').show();
                        scope.firstShow = false;
                    }
                    element.find('article').css('opacity', 1);
                    element.find('article').css('z-index', 1000);
                }
                scope.showOptions = !scope.showOptions;
                scope.$apply();
            });
            var close = function(e){
				if(element.find(e.target).length > 0)
                    return;
                hide();
                scope.showOptions = false;
				scope.$apply();
			};
            $('body').on('click', close);

            // Filter labels in search field
            scope.filterByLabel = (option) => {
                if (!option.label)
                    option.label = '';
                return option.label.toLowerCase().includes(scope.searchField.toLowerCase());
            };

            // Select none / all
            scope.select = (checked) => {
                scope.options.forEach(option => {
                    option.checked = checked;
                });
                scope.searchField = "";
            };
            scope.selectNone = () => {
                scope.select(false);
            };
            scope.selectAll = () => {
                scope.select(true);
            };

            // Placing article correctly
            scope.$watch(function() { return element.find('button')[0].offsetHeight }, function(newValue) {
                var article = element.find('article').eq(0);
                article.css('top', (element.find('button')[0].offsetHeight + 1) + 'px');
                article.css('left', '2px');
            });
        }
    };
});