import { ng } from '../ng-start';

export const imgOnError = ng.directive('imgOnError', () => {
    return {
        restrict: 'A',
        link: (scope, element, attr) => {
            element.on('error', () => {
                element.off('error'); // guard against onerror loop in case imgOnError is 404 too ^^
                element.attr('src', attr.imgOnError); 
            });
        }
    }
});