import { ng, _ } from '../entcore';

export const foldingList = ng.directive('foldingList', () => {
    return {
        restrict: 'E',
        template: function(tElement, tAttrs) {
            var elements = '', children = tElement.children();
            for (var i = 0, l = children.length; i < l; i++) {
                elements += children[i].outerHTML;
            }
            return `
                <span ng-repeat="content in (contents = (filtered = (ngModel | filter: filter)) | limitTo: localLimit)">`
                +
                    elements
                +
                `</span>
                <label ng-if="filtered.length > limit && opened" class="chip selected no-margin initial-line-height" ng-click="close()">
                    <span class="cell"><i18n>portal.refold</i18n><i class="up-open left-spacing"></i></span>
                </label>
                <label ng-if="filtered.length > limit && !opened" class="chip selected no-margin initial-line-height" ng-click="open()">
                    <span class="cell">... <i18n>chip.more1</i18n> [[filtered.length - limit]] <i18n>chip.more2</i18n><i class="down-open left-spacing"></i></span>
                </label>
        `},

        scope: {
            ngModel: '=',
            limit: '=',
            filter: '&'
        },

        link: (scope, element, attributes) => {
            scope.opened = false;
            scope.localLimit = scope.limit;

            scope.open = function() {
                scope.localLimit = scope.ngModel.length;
                scope.opened = true;
            }

            scope.close = function() {
                scope.localLimit = scope.limit;
                scope.opened = false;
            }
        }
    };
});