import { LibraryPublication, LibraryService, libraryServiceProvider, LibraryServiceProvider } from './library.service';
import { module } from 'angular';

const testingModule = 'libraryServiceTestingModule';

describe('libraryService', function () {
    let $compile,
        $rootScope,
        libraryService: LibraryService;

    describe('getResourceInformationFromResource', () => {
        it(`should throw error 'invokableResourceInformationGetterFromResource not defined' when not configured`, () => {
            new TestModuleBuilder().module();
            expect(() => {
                libraryService.getResourceInformationFromResource('id1')
            }).toThrowError('invokableResourceInformationGetterFromResource not defined');
        });

        it(`should call the given invokableResourceInformationGetterFromResource`, () => {
            let invokableResourceInformationGetterFromResource;
            new TestModuleBuilder().config((libraryServiceProvider: LibraryServiceProvider<{ _id: string, name: string }>) => {
                libraryServiceProvider.setInvokableResourceInformationGetterFromResource(function () {
                    invokableResourceInformationGetterFromResource = jasmine.createSpy('invokableResourceInformationGetterFromResource');
                    return invokableResourceInformationGetterFromResource;
                });
            }).module();
            libraryService.getResourceInformationFromResource({_id: 'id1', name: 'title1'});
            expect(invokableResourceInformationGetterFromResource).toHaveBeenCalledWith({_id: 'id1', name: 'title1'});
        });
    });

    describe('publish', () => {
        it(` should throw error 'publishUrlGetterFromId not defined' when not configured`, () => {
            new TestModuleBuilder().module();
            expect(() => {
                libraryService.publish('id1', {title: 'title1', cover: null, keyWords: [], description: '', activityType: [], teachingContext: '', language: 'fr-FR', subjectArea: [], age: [3, 16]})
            }).toThrowError('publishUrlGetterFromId not defined');
        });

        it(`should call the given publishUrlGetterFromId`, () => {
            let publishUrlGetterFromId = jasmine.createSpy('publishUrlGetterFromId');
            new TestModuleBuilder().config((libraryServiceProvider: LibraryServiceProvider<{}>) => {
                libraryServiceProvider.setPublishUrlGetterFromId(publishUrlGetterFromId);
            }).module();
            libraryService.publish('id1', {title: 'title1', cover: null, keyWords: [], description: '', activityType: [], teachingContext: '', language: 'fr-FR', subjectArea: [], age: [3, 16]});
            expect(publishUrlGetterFromId).toHaveBeenCalledWith('id1');
        });
    });

    class TestModuleBuilder {
        private testModule = module(testingModule, [])
            .provider('libraryService', LibraryServiceProvider);

        config(fn: (LibraryServiceProvider) => void): TestModuleBuilder {
            this.testModule.config(['libraryServiceProvider', fn]);
            return this;
        }

        module() {
            angular.mock.module(testingModule);
            angular.mock.inject(function (_$compile_, _$rootScope_, _libraryService_) {
                $rootScope = _$rootScope_;
                $compile = _$compile_;
                libraryService = _libraryService_;
            });
        }
    }
});