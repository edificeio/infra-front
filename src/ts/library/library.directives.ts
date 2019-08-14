import { Directive, ng } from '../ng-start';
import {
    ActivityType,
    allActivityTypes,
    allLangages,
    allSubjectAreas,
    Langage,
    LibraryPublication,
    LibraryResourceInformation,
    LibraryService,
    libraryServiceProvider,
    SubjectArea
} from './library.service';

ng.providers.push(libraryServiceProvider);

export const libraryResourceDirective: Directive = ng.directive('libraryResource', function <R>() {
    return {
        restrict: 'A',
        require: '^^libraryRoot',
        scope: {
            libraryResource: '='
        },
        link: function link(scope, element, attrs, libraryRoot: LibraryRootController<R>) {
            element.on('click', function () {
                libraryRoot.openPublishControllerWithResource(scope.libraryResource);
            });
        }
    };
});

export class LibraryRootController<R> {
    static $inject = ['libraryService'];

    constructor(private libraryService: LibraryService<R>) {
        libraryService.registerLibraryRootController(this);
    }

    private publishController: LibraryPublishController<R>;

    registerPublishController(publishController: LibraryPublishController<R>) {
        this.publishController = publishController;
    }

    openPublishControllerWithResource(resource: R): Promise<void> {
        const result = this.libraryService.getResourceInformationFromResource(resource);
        return this.publishController.open(result.id, result.resourceInformation);
    }
}

export const libraryRootDirective: Directive = ng.directive('libraryRoot', function <U>() {
    return {
        restrict: 'A',
        controller: LibraryRootController
    };
});

export class LibraryPublishController<R> {
    public show = false;
    public publication: LibraryPublication;
    public allActivityTypes: ActivityType[] = allActivityTypes;
    public allSubjectAreas: SubjectArea[] = allSubjectAreas;
    public allLanguages: Langage[] = allLangages;
    public revocableUrl: string;
    private id: string;

    static $inject = ['$scope', '$q', '$http', 'libraryService'];

    constructor(private $scope, private $q, private $http, private libraryService: LibraryService<R>) {
        $scope.$watch(() => this.publication ? this.publication.cover : undefined, () => {
            if (this.revocableUrl) {
                URL.revokeObjectURL(this.revocableUrl);
                this.revocableUrl = undefined;
            }
            if (this.publication && this.publication.cover) {
                if ((this.publication.cover as any).length) {
                    this.publication.cover = (this.publication.cover as any)[0];
                }
                this.revocableUrl = URL.createObjectURL(this.publication.cover);
            }
        });
    }

    open(id: string, resourceInformation: LibraryResourceInformation): Promise<void> {
        const blobDeferred = this.$q.defer();
        if (resourceInformation.cover) {
            this.$http({url: resourceInformation.cover, responseType: 'blob', method: 'GET'})
                .then(function (response) {
                    blobDeferred.resolve(response.data);
                }, (e) => {
                    blobDeferred.reject(e);
                });
        } else {
            blobDeferred.resolve(null);
        }
        return blobDeferred.promise.then(cover => {
            this.show = true;
            this.id = id;
            const defaultPublication: LibraryPublication = {
                title: '',
                activityType: [],
                age: [3, 16],
                cover: null,
                description: '',
                keyWords: [],
                language: 'fr-FR',
                subjectArea: [],
                teachingContext: ''
            };
            this.publication = Object.assign({}, defaultPublication, {title: resourceInformation.title, cover});
        });
    }

    close() {
        this.show = false;
        this.publication = undefined;
        this.id = undefined;
        this.$scope.$apply();
    }

    publish(): Promise<any> {
        return this.libraryService.publish(this.id, this.publication)
            .then(() => this.close());
    }
}

export const libraryPublishDirective: Directive = ng.directive('libraryPublish', function <R>() {
    return {
        restrict: 'E',
        scope: {},
        require: ['^^libraryRoot', 'libraryPublish'],
        controller: LibraryPublishController,
        controllerAs: 'libraryPublishController',
        bindToController: true,
        link: function link(scope, element, attrs, controllers: [LibraryRootController<R>, LibraryPublishController<R>]) {
            const libraryRootController: LibraryRootController<R> = controllers[0];
            const libraryPublishController: LibraryPublishController<R> = controllers[1];
            libraryRootController.registerPublishController(libraryPublishController);
        },
        template: `
<lightbox show="libraryPublishController.show">
    <h2>Publier dans la bibliothèque</h2>
    <div class="row">
    <p class="medium-importance">La Bibliothèque est un espace privé de partage d'activités et de ressources numériques mutualisées entre enseignants. <a href="">En savoir plus</a></p>
    <p class="small-text italic-text medium-importance">Tous les champs suivis d'une étoile (*) sont obligatoires.</p>
    </div>
    <div class="row">
      <form>
        <div class="row top-spacing-four">
          <label class="cell twelve bold" for="">Titre (maximum XX caractères) :</label>
          <input class="cell twelve top-spacing-twice" name="title" ng-model="libraryPublishController.publication.title" type="text" placeholder="Veuillez entrer le nom de votre activité">
        </div>
        <div class="row top-spacing-twice">
          <div class="cell ten">
            <label class="bold" for="">Vignette de l'activité :</label>
            <div class="vertical-spacing-twice horizontal-spacing-twice ">
              <file-picker-list files="libraryPublishController.publication.cover"></file-picker-list>
            </div>
          </div>
          <div class="cell two right-magnet">
            <label class="bold" for="">Aperçu :</label>
            <div class="vertical-spacing-twice">
              <img ng-if="libraryPublishController.revocableUrl" ng-src="[[libraryPublishController.revocableUrl]]" alt="">
            </div>
          </div>
        </div>
        <div class="row top-spacing-twice">
          <label class="cell five bold" for="">Type d'activité :</label>
          <div class="cell five">
            <select class="twelve" multiple ng-options="activityType for activityType in libraryPublishController.allActivityTypes" ng-model="libraryPublishController.publication.activityType"></select>
          </div>
        </div>
        <div class="row top-spacing-twice">
          <label class="cell five bold"for="">Discipline :</label>
          <div class="cell five">
            <select class="twelve" multiple ng-options="subjectArea for subjectArea in libraryPublishController.allSubjectAreas" ng-model="libraryPublishController.publication.subjectArea" required></select>
          </div>
        </div>
        <div class="row top-spacing-twice">
          <label class="cell five bold" for="">Âge des élèves :</label>
          <!-- A intégrer quand on aura choisit la place dans infra-front :
          https://codepen.io/sakamies/pen/qOEGLJ -->
          <input ng-model="libraryPublishController.publication.age" class="cell five" type="range" multiple min="0" step="1" max="20" data-values="1 9">
        </div>
        <div class="row top-spacing-twice">
          <label class="cell five bold" for="">Langue :</label>
          <select ng-options="language for language in libraryPublishController.allLanguages" ng-model="libraryPublishController.publication.language" class="cell five"></select>
        </div>
        <div class="row top-spacing-twice">
          <label class="cell twelve bold" for="">Description et contexte de l'activité :</label>
          <textarea ng-model="libraryPublishController.publication.description" name="name" rows="8" cols="80" placeholder="Quels sont les thèmes abordés dans votre activité? Quelles objectifs pédagogiques souhaitez-vous atteindre?"></textarea>
        </div>
        <div class="row top-spacing-twice">
          <label class="bold" for="">Recherchez et ajoutez des mots clés (5 maximum) :</label>
          <recipient-list
                 ng-model="libraryPublishController.publication.keyWords"
                 ng-change="<function>()"
                 update-found-items="<function>(search, model, founds)">
          </recipient-list>
        </div>
        <div class="row top-spacing-twice">
          <input type="checkbox" name="" value="">
          <label for="">Je suis d'accord pour publier le sujet en Creative Commons
            <a href="https://creativecommons.org/licenses/by/4.0/deed.fr">
              <img height="16px" src="assets/themes/entcore-css-lib/images/cc-by.svg" alt="Logo Creative Commons BY">
            </a>
          </label>
        </div>
        <div class="row top-spacing-ten">
            <p class="cell seven medium-importance small-text bottom-magnet">
              <i class="help"></i>
              Besoin d'aide? Consulter l'aide en ligne ou contactez-nous via l'application Assistance ENT
            </p>
            <!-- Le bouton "publier" reste griser tant que la personne n'a pas coché la case pour la licence -->
            <!-- Il faut rajouter la class .loading quand ça charge -->
            <button type="submit" ng-click="libraryPublishController.publish()" class="right-magnet"><i18n>publish</i18n></button>
            <button type="button" ng-click="libraryPublishController.close()" class="cancel right-magnet"><i18n>cancel</i18n></button>
        </div>
      </form>
    </div>
</lightbox>
`
    };
});
