import { ng } from '../ng-start';
import { LibraryService, libraryServiceProvider } from './library.service';

ng.providers.push(libraryServiceProvider);

export const libraryDirective = ng.directive('library', function <U>() {
    return {
        restrict: 'A',
        scope: {
            item: '@'
        },
        controller: ['libraryService', function (libraryService: LibraryService<U>) {
            this.share = function (item: U) {
                return libraryService.share(item);
            }
        }],
        link: function link(scope, element, attrs, controller) {
            element.on('click', function () {
                controller.share(scope.item);
            });
        }
    };
});
