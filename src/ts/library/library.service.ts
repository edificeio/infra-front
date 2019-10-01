import { ng, Provider } from '../ng-start';
import { LibraryRootController } from './library.directives';
import { LibraryPublication, LibraryResourceInformation, IdAndLibraryResourceInformation } from './library.types';
import { model } from '../modelDefinitions';

export interface LibraryService<R> {
    publish(id: string, publication: LibraryPublication): Promise<any>;
    getResourceInformationFromResource(resource: R): { id: string, resourceInformation: LibraryResourceInformation };
    registerLibraryRootController(libraryRootController: LibraryRootController<R>): void;
    openPublishControllerWithResource(resource: R): Promise<void>;
}

export class LibraryServiceProvider<R> {
    publishUrlGetterFromId = function (id: string): string {
        throw new Error('publishUrlGetterFromId not defined');
    };

    invokableResourceInformationGetterFromResource = function () {
        return function (resource: R): IdAndLibraryResourceInformation {
            throw new Error('invokableResourceInformationGetterFromResource not defined');
        }
    };

    setInvokableResourceInformationGetterFromResource(_invokableResourceInformationGetterFromResource: (...args: any[]) => ((resource: R) => IdAndLibraryResourceInformation)) {
        this.invokableResourceInformationGetterFromResource = _invokableResourceInformationGetterFromResource;
    }

    $get = ['$http', '$injector', ($http, $injector): LibraryService<R> => {
        const publish = async (id: string, publication: LibraryPublication): Promise<any> => {
            let resAvatar = await $http.get(`/userbook/avatar/${model.me.userId}?thumbnail=48x48`, {responseType: "blob"});
            let teacherAvatar: Blob = resAvatar.data;
            const publicationAsFormData = new FormData();
            publicationAsFormData.append("title", publication.title);
            publicationAsFormData.append("cover", publication.cover);
            publicationAsFormData.append("coverName", publication.cover.name);
            publicationAsFormData.append("coverType", publication.cover.type);
            publicationAsFormData.append("teacherAvatar", teacherAvatar);
            publicationAsFormData.append("teacherAvatarName", teacherAvatar.name || `teacherAvatar_${model.me.userId}`);
            publicationAsFormData.append("teacherAvatarType", teacherAvatar.type);
            publicationAsFormData.append("language", publication.language);
            publication.activityType.forEach(activityType => {
                publicationAsFormData.append("activityType[]", activityType);
            });
            publication.subjectArea.forEach(subjectArea => {
                publicationAsFormData.append("subjectArea[]", subjectArea);
            });
            publication.age.forEach(age => {
                publicationAsFormData.append("age[]", age.toString());
            });
            publicationAsFormData.append("description", publication.description);
            let keyWordsArray = publication.keyWords.split(',')
            keyWordsArray.forEach(keyWord => {
                publicationAsFormData.append("keyWords[]", keyWord.trim());
            });
            publicationAsFormData.append("licence", 'CC-BY');
            publicationAsFormData.append("pdfUri", publication.pdfUri);
            publicationAsFormData.append("application", publication.application);

            // TODO remove teacherCity
            publicationAsFormData.append("teacherCity", "test");

            return $http.post("/appregistry/library/resource", publicationAsFormData, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            });
        };
        const getResourceInformationFromResource = (resource: R): IdAndLibraryResourceInformation => {
            return $injector.invoke(this.invokableResourceInformationGetterFromResource)(resource);
        };

        let libraryRootController: LibraryRootController<R>;
        const registerLibraryRootController = (_libraryRootController: LibraryRootController<R>) => {
            libraryRootController = _libraryRootController;
        };

        const openPublishControllerWithResource = (resource: R): Promise<void> => {
            return libraryRootController.openPublishControllerWithResource(resource);
        };

        return {
            publish,
            registerLibraryRootController,
            openPublishControllerWithResource,
            getResourceInformationFromResource
        };
    }];
}

export const libraryServiceProvider: Provider = ng.provider('libraryService', LibraryServiceProvider);
