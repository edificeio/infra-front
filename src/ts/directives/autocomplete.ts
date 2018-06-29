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
        template: `
            <div class="row">
                <input type="text" class="twelve cell" ng-model="search" translate attr="placeholder" placeholder="search" autocomplete="off" />
                <div data-drop-down class="drop-down">
                    <div>
                        <ul class="ten cell right-magnet">
                            <li ng-repeat="option in match | limitTo:limit" ng-model="option">
                                <a class="cell" ng-class="{'sharebookmark': option.type === 'sharebookmark'}">
                                    <i class="add-favorite cell" ng-if="option.type === 'sharebookmark'"></i>
                                    [[option.name]][[option.displayName]]
                                </a>
                                <em class="left-spacing top-spacing-twice low-importance cell">[[translate(option.profile)]] </em>
                            </li>
                            <li class="display-more" ng-show="limit < match.length" ng-click="increaseLimit()">[[translate('seemore')]]</li>
                        </ul>
                    </div>
                </div>
            </div>
        `,
        link: function (scope, element, attributes) {
            var token;
            if (attributes.autocomplete === 'off') {
                return;
            }
            var dropDownContainer = element.find('[data-drop-down]');
            var linkedInput = element.find('input');
            scope.search = '';
            scope.translate = lang.translate;
            scope.limit = 6;
            scope.match = [];

            scope.increaseLimit = function(){
				scope.limit += 5;
				$timeout(function(){
					scope.setDropDownHeight()
				});
			};

            scope.setDropDownHeight = function () {
                var liHeight = 0;
                var max = Math.min(scope.limit, scope.match.length);
                dropDownContainer.find('li').each(function (index, el) {
                    liHeight += $(el).height();

                    return index < max;
                })
                dropDownContainer.height(liHeight)
            };

            var placeDropDown = function () {
                if(!scope.match || scope.match.length === 0){
					dropDownContainer.height();
					dropDownContainer.addClass('hidden');
					scope.limit = 6;
					dropDownContainer.attr('style', '');
					return;
                }
                
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
                scope.setDropDownHeight();
				setTimeout(function(){
					scope.setDropDownHeight()
				}, 100);

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
                    scope.limit = 6;
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

            dropDownContainer.detach().appendTo('body');

            dropDownContainer.on('click', 'li', function (e) {
                if($(e.target).hasClass('display-more')){
					return;
				}
				scope.limit = 6;
				dropDownContainer.attr('style', '');
                scope.ngModel = $(this).scope().option;
                scope.search = '';
                scope.$apply('ngModel');
                scope.$eval(scope.ngChange);
                scope.$apply('ngModel');
                dropDownContainer.addClass('hidden');
                cancelAnimationFrame(token);
            });

            var closeDropDown = function(e){
				if(element.find(e.target).length > 0 || dropDownContainer.find(e.target).length > 0){
					return;
				}
				scope.match = [];
				scope.$apply();
			};

			$('body').on('click', closeDropDown);
            dropDownContainer.attr('data-opened-drop-down', true);
        }
    }
}]);
