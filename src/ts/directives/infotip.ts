import { ng } from '../ng-start';
import { Me } from '../me';

export let infotip = ng.directive('infotip', () => {
    return {
        restrict: 'E',
        template: `
            <i class="close"></i>
            <div ng-transclude></div>
        `,
        scope: {name: '@', onChange: '&'},
        transclude: true,

        link: async (scope, element, attributes) => {
            const onChange = function () {
                let isFalse = infotips[scope.name] === false;
                scope.onChange && scope.onChange({'$visible': !isFalse});
            };
            let infotips = await Me.preference('infotip');
            onChange();
            if (infotips[scope.name] === false) {
                element.remove();
            } else {
                element.css({'display': !!attributes.display ? attributes.display : 'block'});
            }

            element.children('i').on('click', () => {
                element.slideUp();
                Me.preferences.infotip[scope.name] = false;
                onChange();
                Me.savePreference('infotip');
            })
        }
    }
});
