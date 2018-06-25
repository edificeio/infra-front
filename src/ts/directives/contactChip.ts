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
            <span class="cell round square-small" ng-class="{ group: ngModel.name }">
                <img ng-if="ngModel.name" skin-src="/img/illustrations/group-avatar.svg"/>
                <img ng-if="!ngModel.name" ng-src="/userbook/avatar/[[ngModel.id]]?thumbnail=100x100"/>
            </span>
            <span ng-if="!ngModel.name" class="cell circle square-mini" ng-class="profile()"></span>
            <span ng-if="ngModel.name" class="cell-ellipsis block left-text">[[ ngModel.name ]]</span>
            <span ng-if="!ngModel.name" class="cell-ellipsis block left-text">[[ ngModel.displayName ]]</span>
            <i class="absolute-magnet" 
                ng-if="(stickernotselected || !ngModel.selected) && (isMovable() || isRemovable())" 
                ng-class="{ 'right-arrow':isMovable(), 'close':isRemovable() }"
                ng-click="action({item:ngModel}); $event.stopPropagation();">
            </i>
        `,

        scope: {
            ngModel: '=',
            action: '&'
        },

        link: (scope, element, attributes) => {
            scope.stickernotselected = attributes.hasOwnProperty('stickernotselected');
            console.log(scope.stickerNotSelected)
            console.log(attributes)
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

            scope.onGeneralClick = function() {
                scope.action({item:scope.ngModel});
            };

            element.on('click', function() {
                if (scope.isChipHover()) {
                    scope.onGeneralClick();
                }
            });
        }
    };
});