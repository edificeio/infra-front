import { ng } from '../ng-start';
import { Me } from '../me';
import http from 'axios';

export let infotip = ng.directive('infotip', () => {
    return {
        restrict: 'E',
        template: `
            <i class="close"></i>
            <div ng-transclude></div>
        `,
        scope: { name: '@' },
        transclude: true,
        link: async (scope, element, attributes) => {
             let infotips = await Me.preference('infotip');
             if(infotips[scope.name] === false){
                 element.remove();
             }
             else{
                 element.css({ 'display': 'block' });
             }

             element.children('i').on('click', () => {
                 element.slideUp();
                 Me.preferences.infotip[scope.name] = false;
                 Me.savePreference('infotip');
             })
        }
    }
})