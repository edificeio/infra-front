import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';
import { _ } from '../libs/underscore/underscore';
import { idiom as lang } from '../idiom';

export let autocomplete = ng.directive('autocomplete', ['$timeout', function ($timeout) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            options: '&',
            ngModel: '=',
            ngChange: '&',
            search: '=?'
        },
        template: '' +
        '<div class="row">' +
        '<input type="text" class="twelve cell" ng-model="search" translate attr="placeholder" placeholder="search" autocomplete="off" />' +
        '<div data-drop-down class="drop-down autocomplete">' +
        '<div>' +
        '<ul class="ten cell right-magnet">' +
        '<li ng-repeat="option in match | limitTo:10" ng-model="option">[[option.toString()]]</li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>',
        link: function (scope, element, attributes) {
            var token;
            if (attributes.autocomplete === 'off') {
                return;
            }
            var dropDownContainer = element.find('[data-drop-down]');
            var linkedInput = element.find('input');
            scope.search = '';
            scope.match = [];

            scope.setDropDownHeight = function () {
                var liHeight = 0;
                var max = Math.min(10, scope.match.length);
                dropDownContainer.find('li').each(function (index, el) {
                    liHeight += $(el).height();
                    return index < max;
                })
                dropDownContainer.height(liHeight)
            };

            var placeDropDown = function () {
                var pos = linkedInput.offset();
                var width = linkedInput.width() +
                    parseInt(linkedInput.css('padding-right')) +
                    parseInt(linkedInput.css('padding-left')) +
                    parseInt(linkedInput.css('border-width') || 1) * 2;
                var height = linkedInput.height() +
                    parseInt(linkedInput.css('padding-top')) +
                    parseInt(linkedInput.css('padding-bottom')) +
                    parseInt(linkedInput.css('border-height') || 1) * 2;

                pos.top = pos.top + height;
                dropDownContainer.offset(pos);
                dropDownContainer.width(width);
                $timeout(function () {
                    scope.setDropDownHeight();
                }, 1);

                token = requestAnimationFrame(placeDropDown);
            };

            scope.$watch('search', function (newVal) {
                if (!newVal) {
                    scope.match = [];
                    dropDownContainer.height("");
                    dropDownContainer.addClass('hidden');
                    return;
                }
                scope.match = _.filter(scope.options(), function (option) {
                    var words = newVal.split(' ');
                    return _.find(words, function (word) {
                        var formattedOption = lang.removeAccents(option.toString()).toLowerCase();
                        var formattedWord = lang.removeAccents(word).toLowerCase();
                        return formattedOption.indexOf(formattedWord) === -1
                    }) === undefined;
                });
                if (!scope.match || scope.match.length === 0) {
                    dropDownContainer.height("");
                    dropDownContainer.addClass('hidden');
                    return;
                }
                dropDownContainer.removeClass('hidden');
                cancelAnimationFrame(token);
                placeDropDown();
            });

            element.parent().on('remove', function () {
                cancelAnimationFrame(token);
                dropDownContainer.remove();
            });

            scope.$on("$destroy", function() {
                cancelAnimationFrame(token);
                dropDownContainer.remove();
            });

            element.find('input').on('blur', function () {
                cancelAnimationFrame(token);
                setTimeout(function () {
                    scope.search = '';
                }, 200);
            });
            dropDownContainer.detach().appendTo('body');

            dropDownContainer.on('click', 'li', function (e) {
                scope.ngModel = $(this).scope().option;
                scope.search = '';
                scope.$apply('ngModel');
                scope.$eval(scope.ngChange);
                scope.$apply('ngModel');
                dropDownContainer.addClass('hidden');
                cancelAnimationFrame(token);
            });
            dropDownContainer.attr('data-opened-drop-down', true);
        }
    }
}]);
