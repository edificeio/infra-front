import { ng, _ } from '../entcore';
import { ui } from '../ui';

/**
 * @description A list that can be filtered and items can be removed.
 * @example
 *  
 */

export const contactChip = ng.directive('contactChip', () => {
    return {
        restrict: 'E',
        template: `
            <span class="cell round bg-white square-small" ng-class="{ group: isChipGroup() }">
                <img ng-if="isChipGroup()" skin-src="/img/illustrations/group-avatar.svg"/>
                <img ng-if="!isChipGroup()" ng-src="/userbook/avatar/[[id]]?thumbnail=100x100"/>
            </span>
            <span ng-if="!isChipGroup()" class="cell circle square-mini" ng-class="profile()"></span>
            <span ng-if="isChipGroup()" class="cell-ellipsis block left-text">[[ ngModel.name ]]</span>
            <span ng-if="!isChipGroup()" class="cell-ellipsis block left-text">[[ ngModel.name ]][[ ngModel.displayName ]]</span>
            <i class="absolute-magnet" 
                ng-if="(stickernotselected || !ngModel.selected) && (isMovable() || isRemovable())" 
                ng-class="{ 'right-arrow':isMovable(), 'close':isRemovable() }"
                ng-click="iconActionExists ? actionIcon({item:ngModel}) : action({item:ngModel}); $event.stopPropagation();">
            </i>
        `,

        scope: {
            ngModel: '=',
            action: '&',
            actionIcon: '&'
        },

        link: (scope, element, attributes) => {
            scope.stickernotselected = attributes.hasOwnProperty('stickernotselected');
            scope.isGroup = attributes.hasOwnProperty('isgroup');
            scope.iconActionExists = !angular.isUndefined(attributes.actionIcon);
            scope.id = scope.ngModel.id ? scope.ngModel.id : scope.ngModel._id;
            scope.profile = function() {
                return ui.profileColors.match(scope.ngModel.profile);
            };

            scope.isMovable = function() {
                return element.hasClass('movable');
            };

            scope.isRemovable = function() {
                return element.hasClass('removable');
            };

            scope.isChipHover = function() {
                return element.hasClass('chip-hover');
            };

            scope.isChipGroup = function() {
                return scope.isGroup || scope.ngModel.groupType || scope.ngModel.isGroup || scope.ngModel.type === 'group';
            };

            scope.onGeneralClick = function() {
                scope.action({item:scope.ngModel});
            };

            element.on('click', function() {
                if (scope.isChipHover() || scope.iconActionExists) {
                    scope.onGeneralClick();
                }
            });

            // Tootltip
            element.on("mouseenter", function() {
                var ellispsis = element.find('.cell-ellipsis');
                for (var i = 0, l = ellispsis.length; i < l; i++) {
                    if (ellispsis[i].offsetWidth < ellispsis[i].scrollWidth) {
                        ellispsis.eq(i).attr('title', scope.isChipGroup() ? scope.ngModel.name : (scope.ngModel.name ? scope.ngModel.name : "") + (scope.ngModel.displayName ? scope.ngModel.displayName : ""));
                    }
                    else {
                        ellispsis.eq(i).attr('title', null);
                    }
                }
            });
        }
    };
});