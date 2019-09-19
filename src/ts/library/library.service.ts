import { ng, Provider } from '../ng-start';
import { LibraryRootController } from "./library.directives";

export interface LibraryService<R> {
    publish(id: string, publication: LibraryPublication): Promise<any>;

    getResourceInformationFromResource(resource: R): { id: string, resourceInformation: LibraryResourceInformation };

    registerLibraryRootController(libraryRootController: LibraryRootController<R>): void;

    openPublishControllerWithResource(resource: R): Promise<void>;
}

export interface LibraryResourceInformation {
    title: string;
    cover: string;
    application: string;
    pdfUri: string;
}

export type SubjectArea =
    "Activités artistiques" |
    "Allemand" |
    "Anglais" |
    "Apprentissage de la lecture" |
    "Chimie" |
    "Découverte du monde" |
    "Droit" |
    "Economie" |
    "Education aux médias" |
    "Education musicale" |
    "Education physique et sportive" |
    "Enseignement civique" |
    "Espagnol" |
    "Français" |
    "Géographie" |
    "Histoire" |
    "Histoire des arts" |
    "Informatique" |
    "Italien" |
    "Langues" |
    "Langues anciennes" |
    "Littérature" |
    "Mathématiques" |
    "Orientation" |
    "Philosophie" |
    "Physique" |
    "Portugais" |
    "Sciences politiques" |
    "Sociologie" |
    "SVT - Biologie" |
    "SVT - Géologie" |
    "Technologie" |
    "Autre";

export const allSubjectAreas: SubjectArea[] = ["Activités artistiques", "Allemand", "Anglais", "Apprentissage de la lecture", "Autre", "Chimie", "Droit", "Découverte du monde", "Economie", "Education aux médias", "Education musicale", "Education physique et sportive", "Enseignement civique", "Espagnol", "Français", "Géographie", "Histoire", "Histoire des arts", "Informatique", "Italien", "Langues", "Langues anciennes", "Littérature", "Mathématiques", "Orientation", "Philosophie", "Physique", "Portugais", "Sciences politiques", "Sociologie", "SVT - Biologie", "SVT - Géologie", "Technologie"];

export type ActivityType =
    "Activité en classe" |
    "Activité à la maison" |
    "Activité individuelle" |
    "Activité en groupe" |
    "Parcours pédagogique" |
    "Élément de cours" |
    "Exercice" |
    "Autre";

export const allActivityTypes: ActivityType[] = ["Autre", "Activité en classe", "Activité en groupe", "Activité individuelle", "Activité à la maison", "Exercice", "Parcours pédagogique", "Élément de cours"];

export type Langage =
    "Allemand" |
    "Anglais" |
    "Arabe" |
    "Espagnol" |
    "Français" |
    "Italien" |
    "Japonais" |
    "Mandarin" |
    "Portugais" |
    "Russe" |
    "Autre";

export const allLangages: Langage[] = ["Allemand", "Anglais", "Arabe", "Espagnol", "Français", "Italien", "Japonais", "Mandarin", "Portugais", "Russe", "Autre"];

export interface LibraryPublication {
    title: string;
    cover: Blob;
    language: Langage;
    teachingContext: string;
    activityType: ActivityType[];
    subjectArea: SubjectArea[];
    age: [number, number];
    description: string;
    keyWords: string[];
    pdfUri: string;
    application: string;
}

export interface IdAndLibraryResourceInformation {
    id: string;
    resourceInformation: LibraryResourceInformation;
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
        const publish = (id: string, publication: LibraryPublication): Promise<any> => {
            const publicationAsFormData = new FormData();

            publicationAsFormData.append("title", publication.title);
            publicationAsFormData.append("cover", publication.cover);
            publicationAsFormData.append("language", publication.language);
            publicationAsFormData.append("teachingContext", publication.teachingContext);
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
            publication.keyWords.forEach(keyWord => {
                publicationAsFormData.append("keyWords[]", keyWord);
            });
            //TODO
            publicationAsFormData.append("teacherCity", "Le Creusot");
            publicationAsFormData.append("licence", "CC BY");
            publicationAsFormData.append("coverName", "cover.png");
            publicationAsFormData.append("coverType", "image/png");
            publicationAsFormData.append("pdfUri", publication.pdfUri);
            publicationAsFormData.append("application", publication.application);
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
