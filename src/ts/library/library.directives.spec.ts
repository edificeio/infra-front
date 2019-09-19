import { module } from 'angular';
import { libraryPublishDirective, libraryResourceDirective, libraryRootDirective } from './library.directives';
import { IdAndLibraryResourceInformation, LibraryService } from './library.service';

const testingModule = 'libraryDirectivesTestingModule';

export interface MockedModel {
    _id: string;
    name: string;
    icon: string;
}

describe('libraryDirectives', function () {
    let $compile,
        $rootScope,
        libraryService: LibraryService<MockedModel>;

    beforeEach(() => {
        const resourceInformation: IdAndLibraryResourceInformation = {
            id: 'id1',
            resourceInformation: {title: 'title1', cover: null, application: "test", pdfUri:"http://google.fr"}
        };

        module(testingModule, [])
            .directive(libraryResourceDirective.name, libraryResourceDirective.contents)
            .directive(libraryRootDirective.name, libraryRootDirective.contents)
            .directive(libraryPublishDirective.name, libraryPublishDirective.contents)
            .factory('libraryService', function (): LibraryService<MockedModel> {
                return {
                    publish: jasmine.createSpy('publish').and.callFake(() => new Promise(() => {
                    })),
                    registerLibraryRootController: jasmine.createSpy('registerLibraryRootController'),
                    openPublishControllerWithResource: jasmine.createSpy('openPublishControllerWithResource'),
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

    it('should calls the libraryService.registerLibraryRootController at boot up', () => {
        const element = new LibraryDirectivesElementBuilder($compile, $rootScope).value();
        expect(libraryService.registerLibraryRootController).toHaveBeenCalled();
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

    it(`should calls the libraryService.publish
            when clicking on LibraryResource directive and submitting the form`, function () {
        const element = new LibraryDirectivesElementBuilder($compile, $rootScope).value();
        element.find('[library-resource]').click();
        $rootScope.$digest();
        element.find('form').scope().libraryPublishController.publishForm.title.$setViewValue('title2');
        element.find('form').trigger('submit');
        $rootScope.$digest();
        expect(libraryService.publish).toHaveBeenCalledWith('id1', {
            title: 'title2',
            activityType: [],
            age: [3, 16],
            cover: null,
            description: '',
            keyWords: [],
            language: 'fr-FR',
            subjectArea: [],
            teachingContext: ''
        });
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