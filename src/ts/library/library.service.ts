import { ng } from '../ng-start';

export const libraryServiceProvider = ng.provider('libraryService', function LibraryServiceProvider<U>() {
    let applicationShareToLibraryEndpointFn = function (item: U): string {
        throw new Error('application library endpoint not defined');
    };

    this.setApplicationShareToLibraryEndpointFn = function (_applicationShareToLibraryEndpoint) {
        applicationShareToLibraryEndpointFn = _applicationShareToLibraryEndpoint;
    };

    this.$get = ['$http', function LibraryServiceFactory($http) {
        return {
            share: function (item: U) {
                $http.post(applicationShareToLibraryEndpointFn(item), {});
            }
        };
    }];
});

export interface LibraryService<U> {
    share(item: U): Promise<any>
}
