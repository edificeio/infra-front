import { libraryPublishDirective, libraryResourceDirective, libraryRootDirective } from './library.directives';
import { LibraryResourceInformation, LibraryService } from './library.service';
import { module } from 'angular';

const testingModule = 'libraryDirectivesTestingModule';

describe('libraryDirectives', function () {
    let $compile,
        $rootScope,
        libraryService: LibraryService;

    beforeEach(() => {
        const resourceInformation: { id: string, resourceInformation: LibraryResourceInformation } = {
            id: 'id1',
            resourceInformation: {title: 'title1', cover: null}
        };

        module(testingModule, [])
            .directive(libraryResourceDirective.name, libraryResourceDirective.contents)
            .directive(libraryRootDirective.name, libraryRootDirective.contents)
            .directive(libraryPublishDirective.name, libraryPublishDirective.contents)
            .factory('libraryService', function (): LibraryService {
                return {
                    publish: jasmine.createSpy('publish'),
                    getResourceInformationFromResource: jasmine.createSpy('getResourceInformationFromResource').and.returnValue(resourceInformation)
                }
            });
        angular.mock.module(testingModule);
        angular.mock.inject(function (_$compile_, _$rootScope_, _libraryService_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
            libraryService = _libraryService_;
        });
    });

    it(`should calls the libraryService.getResourceInformationFromResource
            when clicking on LibraryResourceId directive`, function () {
        const element = new LibraryDirectivesElementBuilder($compile, $rootScope).value();
        element.find('[library-resource]').click();
        expect(libraryService.getResourceInformationFromResource).toHaveBeenCalledWith({_id: 'id1', name: 'title1'});
    });

    it(`should open the publish view with the resource information
            when clicking on LibraryResource directive`, function () {
        const element = new LibraryDirectivesElementBuilder($compile, $rootScope).value();
        element.find('[library-resource]').click();
        $rootScope.$digest();
        expect(element.find('input[name=title]').val()).toBe('title1');
    });
});


class LibraryDirectivesElementBuilder {
    constructor(private $compile, private $rootScope) {
    }

    value() {
        this.$rootScope.myResource = {_id: 'id1', name: 'title1'};
        const element = this.$compile(`
<div library-root>
    <button library-resource="myResource"></button>
    <library-publish></library-publish>
</div>
        `)(this.$rootScope);
        this.$rootScope.$digest();
        return element;
    }
}