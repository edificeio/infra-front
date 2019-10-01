import { Directive, ng } from '../ng-start';
import { LibraryService, libraryServiceProvider } from './library.service';
import { ActivityType,
    allActivityTypes,
    allLangages,
    allSubjectAreas,
    Langage,
    LibraryPublication,
    LibraryResourceInformation,
    SubjectArea,
    LibraryPublicationResponse
} from './library.types';
import { idiom } from '../idiom';

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
    public publicationResponse: LibraryPublicationResponse;
    public showLightboxResponse: boolean;
    public allActivityTypes: { label: string, type: ActivityType }[] = allActivityTypes.map(activityType => ({
        label: activityType,
        type: activityType
    }));
    public allSubjectAreas: { label: string, type: SubjectArea }[] = allSubjectAreas.map(subjectArea => ({
        label: subjectArea,
        type: subjectArea
    }));
    public allLanguages: Langage[] = allLangages;
    public revocableUrl: string;
    public loading = false;
    public licence: 'CC-BY' | 'none' = 'none';
    public sliderOptions: { connect: boolean, range: { min: number, max: number }, step: number, pips?: any, tooltips: any, format: any } = {
        connect: true,
        range: {min: 1, max: 20},
        step: 1,
        tooltips: [true, true],
        format: {
            to: (value) => Math.floor(value).toString(),
            from: (value) => parseInt(value)
        }
    };
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
        const baseUri = `${window.location.protocol}//${window.location.host}`
        const pdfUri = `${baseUri}${resourceInformation.pdfUri}`;
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
                keyWords: '',
                language: 'Français',
                subjectArea: [],
                teachingContext: '',
                application: '',
                pdfUri: '',
                licence: ''
            };
            this.publication = Object.assign({}, defaultPublication, {...resourceInformation, cover, pdfUri});
        });
    }

    closePublishLightbox() {
        this.show = false;
        this.publication = undefined;
        this.id = undefined;
    }
    closePublishLightboxAndApply() {
        this.closePublishLightbox();
        this.$scope.$apply();
    } 

    invalidFormFields(): boolean {
        return !this.publication.title
            || !this.publication.cover
            || !this.publication.description
            || this.publication.activityType.length == 0 
            || this.publication.subjectArea.length == 0
            || !this.publication.language;
    }

    publish(): Promise<any> {
        if (!this.loading) {
            this.loading = true;
            this.publicationResponse = {} as LibraryPublicationResponse;
            return this.libraryService.publish(this.id, this.publication)
                .then(res => {
                    this.loading = false;
                    this.closePublishLightbox();
                    let resData: LibraryPublicationResponse = res.data;
                    this.publicationResponse.success = resData.success;
                    this.publicationResponse.message = resData.message;
                    this.publicationResponse.reason = resData.reason;
                    this.publicationResponse.details = resData.details;
                    this.showLightboxResponse = true;
                    this.$scope.$apply();
                }, err => {
                    this.loading = false;
                    this.closePublishLightbox();
                    this.publicationResponse.success = false;
                    this.publicationResponse.message = err;
                    this.showLightboxResponse = true;
                    this.$scope.$apply();
                });
        }
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
            scope.translate = idiom.translate;
        },
        template: `
            <div ng-if="libraryPublishController.show">
                <lightbox class="bpr" show="libraryPublishController.show">
                    <div class="flex-row align-center">
                        <h2><i18n>bpr.form.header</i18n></h2>
                        <span class="tipbox">
                            <div class="tipbox-content bot">
                                <span class="small-text">
                                    <i18n>bpr.form.tip</i18n>
                                </span>
                            </div>
                            <div>
                                <i class="help sticker square-medium"></i>
                            </div>
                        </span>
                    </div>
                    <div class="row">
                        <form ng-submit="libraryPublishController.publish()" 
                            name="libraryPublishController.publishForm"
                            novalidate>
                            <div class="row top-spacing-four">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.title</i18n> * :
                                </label>
                                <input class="cell nine" 
                                    type="text"
                                    name="title" 
                                    ng-model="libraryPublishController.publication.title" 
                                    placeholder="[[translate('bpr.form.publication.title.placeholder')]]" />
                            </div>
                            <div class="row top-spacing-twice">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.cover.upload</i18n> * :
                                </label>
                                <file-picker-list 
                                    class="cell seven"
                                    files="libraryPublishController.publication.cover" 
                                    multiple="false"
                                    hide-list="true">
                                </file-picker-list>
                                <img 
                                    class="cell two file-picker_preview"
                                    ng-if="libraryPublishController.revocableUrl" 
                                    ng-src="[[libraryPublishController.revocableUrl]]" 
                                    alt="" />
                                <i class="file-image cell two"
                                    ng-if="!libraryPublishController.revocableUrl"/>
                            </div>
                            <div class="row top-spacing-twice">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.description</i18n> * :
                                </label>
                                <textarea class="cell nine description"
                                    ng-model="libraryPublishController.publication.description"
                                    name="description"
                                    rows="8"
                                    cols="80"
                                    placeholder="[[translate('bpr.form.publication.description.placeholder')]]">
                                </textarea>
                            </div>
                            <div class="row top-spacing-twice">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.type</i18n> * :
                                </label>
                                <div class="cell nine">
                                    <multi-comboboxes
                                        ng-model="libraryPublishController.publication.activityType"
                                        name="activityType"
                                        options="libraryPublishController.allActivityTypes">
                                    </multi-comboboxes>
                                </div>
                            </div>
                            <div class="row top-spacing-twice">
                                <label class="cell three bold"for="">
                                    <i18n>bpr.form.publication.discipline</i18n> * :
                                </label>
                                <div class="cell nine">
                                    <multi-comboboxes
                                        ng-model="libraryPublishController.publication.subjectArea"
                                        name="subjectArea"
                                        options="libraryPublishController.allSubjectAreas">
                                    </multi-comboboxes>
                                </div>
                            </div>
                            <div class="row top-spacing-twice">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.language</i18n> * :
                                </label>
                                <select ng-model="libraryPublishController.publication.language"
                                    name="language"
                                    ng-options="language for language in libraryPublishController.allLanguages"
                                    class="cell nine language">
                                </select>
                            </div>
                            <div class="row top-spacing-four">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.age</i18n> * :
                                </label>
                                <div class="cell four top-spacing-twice">
                                    <div no-ui-slider
                                        slider-options="libraryPublishController.sliderOptions"
                                        ng-model="libraryPublishController.publication.age"
                                        name="age">
                                    </div>
                                </div>
                            </div>
                            <div class="row top-spacing-twice">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.keywords</i18n> :
                                </label>
                                <input class="cell nine"
                                    type="text"
                                    name="title"
                                    ng-model="libraryPublishController.publication.keyWords"
                                    placeholder="[[ translate('bpr.form.publication.keywords.placeholder') ]]" />
                            </div>
                            <div class="row top-spacing-twice">
                                <div class="flex-row align-center licence-condition">
                                    <i class="info-pic right-spacing bottom-spacing"></i>
                                    <span class="small-text"><i18n>bpr.form.publication.licence.text</i18n></span>
                                    <a href="https://creativecommons.org/licenses/by/4.0/deed.fr"
                                        target="_blank"
                                        class="left-spacing top-spacing">
                                        <img class="licence_image"
                                            src="assets/themes/entcore-css-lib/images/cc-by.svg"
                                            alt="[[translate('bpr.form.publication.licence.image.alt')]]" />
                                    </a>
                                </div>
                            </div>
                            <div class="row top-spacing-four">
                                <div class="cell twelve">
                                    <button type="submit"
                                        class="right-magnet"
                                        ng-disabled="libraryPublishController.invalidFormFields()">
                                        <i18n ng-if="!libraryPublishController.loading">publish</i18n>
                                        <i ng-if="libraryPublishController.loading" class="loading"></i>
                                    </button>
                                    <button type="button" 
                                        ng-click="libraryPublishController.closePublishLightboxAndApply()" 
                                        ng-if="!libraryPublishController.loading" 
                                        class="cancel right-magnet">
                                        <i18n>cancel</i18n>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </lightbox>
            </div>
            <div ng-if="libraryPublishController.showLightboxResponse">
                <lightbox show="libraryPublishController.showLightboxResponse">
                    <div ng-if="libraryPublishController.publicationResponse.success">
                        <h2><i18n>bpr.form.publication.response.success.title</i18n></h2>
                        <i class="congrats"></i>
                        <p>
                            <i18n>bpr.form.publication.response.success.content.1</i18n>
                        </p>
                        <p>
                            <i18n>bpr.form.publication.response.success.content.2</i18n>
                        </p>
                        <button ng-if="libraryPublishController.publicationResponse.details && libraryPublishController.publicationResponse.details.resource_url" 
                            class="right-magnet" 
                            ng-href="[[libraryPublishController.publicationResponse.details.resource_url]]">
                            <i18n>bpr.form.publication.response.success.button</i18n>
                        </button>
                    </div>

                    <div ng-if="!libraryPublishController.publicationResponse.success">
                        <h2><i18n>bpr.form.publication.response.error.title</i18n></h2>
                        <p>[[libraryPublishController.publicationResponse.message]]</p>
                        <p><strong><i18n>bpr.form.publication.response.error.content</i18n></strong></p>
                    </div>
                </lightbox>
            </div>`
    };
});
