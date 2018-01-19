import { ng } from '../ng-start';
import { Me } from "../me";

export let searchUser = ng.directive('searchUser', ['$timeout', ($timeout) => {
    return {
        restrict: 'E',
        template: `
        <form class="input-help" ng-submit="update(true)">
            <label ng-class="{ hide: ngModel.length >= 3 }" user-role="ADMIN_LOCAL">
                <i18n>share.search.help</i18n>
            </label>
            <input type="text" ng-model="ngModel" ng-change="update()" autocomplete="off" ng-class="{ move: ngModel.length > 0 }" />
        </form>
        `,
        scope: { 
            ngModel: '=', 
            onSend: '&',
            clearList: '&'
        },
        link: async (scope, element, attributes) => {
            if(attributes.id){
                element.find('input').attr('id', attributes.id);
                element.attr('id', '');
            }

            element.find('input').on('focus', () => {
                element.addClass('focus');
                element.find('label').addClass('move');
            });

            element.find('input').on('blur', () => {
                setTimeout(() => {
                    element.removeClass('focus');
                    if(!scope.ngModel){
                        element.find('label').removeClass('move');
                    }
                }, 200);
            });

            scope.update = (force?: boolean) => {
                if(!Me.session.functions.ADMIN_LOCAL){
                    force = true;
                }
                $timeout(() => {
                    if((scope.ngModel.length < 3 && !force) || scope.ngModel.length < 1){
                        scope.clearList();
                        return;
                    }
                    if(force || scope.ngModel.length >= 3){
                        scope.onSend();
                    }
                });
            };
        }
    }
}]);