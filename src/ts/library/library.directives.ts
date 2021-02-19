import { Directive, ng } from '../ng-start';
import { LibraryService, libraryServiceProvider } from './library.service';
import { 
    allActivityTypes,
    allLangages,
    allSubjectAreas,
    LibraryPublication,
    LibraryResourceInformation,
    LibraryPublicationResponse
} from './library.types';
import { idiom } from '../idiom';
import { notify } from '../notify';
import { model } from '../modelDefinitions';

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
    public responseBprFullURL: string;
    public showLightboxResponse: boolean;
    public allActivityTypes: { label: string, type: string }[] = allActivityTypes.map(activityType => ({
        label: idiom.translate(activityType),
        customSort: "bpr.other" == activityType? "~" : idiom.translate(activityType).normalize("NFD"),
        type: activityType
    }));
    public allSubjectAreas: { label: string, type: string }[] = allSubjectAreas.map(subjectArea => ({
        label: idiom.translate(subjectArea),
        customSort: "bpr.other" == subjectArea? "~" : idiom.translate(subjectArea).normalize("NFD"),
        type: subjectArea
    }));
    public allLanguages: string[] = allLangages;
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
    public userStructureNames: string[];
    public userAttachmentStructureName: string;
    public multiStructureUser: boolean;

    static $inject = ['$scope', '$q', '$http', '$location', 'libraryService'];

    constructor(private $scope, private $q, private $http, private $location, private libraryService: LibraryService<R>) {
        this.userStructureNames = model.me.structureNames;
        this.multiStructureUser = model.me.structureNames && model.me.structureNames.length > 1;
        this.$http({
            url: `/directory/user/${model.me.userId}/attachment-school`, 
            responseType: 'json',
            method: 'GET'
        }).then(res => {
            if (res.data){ 
                this.userAttachmentStructureName = res.data.name;
            }
        });
        
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
                language: 'fr_FR',
                subjectArea: [],
                application: '',
                pdfUri: '',
                licence: '',
                teacherAvatar: null,
                resourceId: this.id,
                userStructureName: this.userAttachmentStructureName ? this.userAttachmentStructureName : this.userStructureNames && this.userStructureNames[0]
            };
            this.publication = Object.assign({}, defaultPublication, {...resourceInformation, cover, pdfUri});
        }).catch(err => {
            notify.error('bpr.cover.notfound');
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
                    this.publicationResponse = res.data;
                    this.responseBprFullURL = `${this.publicationResponse.details.front_url}?platformURL=${encodeURIComponent(this.$location.host())}`;
                    this.showLightboxResponse = true;
                    this.$scope.$apply();
                }, err => {
                    this.loading = false;
                    this.closePublishLightbox();
                    this.publicationResponse.success = false;
                    this.publicationResponse.message = err.data.message;
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
            scope.orderAllSubjectAreas = "customSort";
            scope.orderAllActivity = "customSort";
            scope.warning = attrs.warning;
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
                    <div ng-if="warning">
                        <p class="warning">[[warning]]</p>
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
                                    <small><i18n>bpr.form.publication.format</i18n> JPG, PNG</small>
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
                                    ng-if="libraryPublishController.revocableUrl != null"/>
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
                                        name="activityType" order="orderAllActivity"
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
                                        name="subjectArea" order="orderAllSubjectAreas"
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
                                    ng-options="translate(language) for language in libraryPublishController.allLanguages"
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
                                    <br /><small><i18n>bpr.form.publication.keywords.separate</i18n></small>
                                </label>
                                <input class="cell nine"
                                    type="text"
                                    name="title"
                                    ng-model="libraryPublishController.publication.keyWords"
                                    placeholder="[[ translate('bpr.form.publication.keywords.placeholder') ]]" />
                            </div>
                            <div ng-if="libraryPublishController.multiStructureUser && !libraryPublishController.userAttachmentStructureName" 
                                class="row top-spacing-twice">
                                <label class="cell three bold" for="">
                                    <i18n>bpr.form.publication.structure</i18n> * :
                                </label>
                                <select ng-model="libraryPublishController.publication.userStructureName"
                                    class="cell nine language">
                                    <option ng-repeat="structureName in libraryPublishController.userStructureNames | orderBy:'toString()'">[[ structureName ]]</option>
                                </select>
                            </div>
                            <div class="row top-spacing-twice">
                                <div class="licence-condition">
                                    <h3 class="top-spacing-four">
                                        <i class="info-pic right-spacing bottom-spacing"></i>
                                        <i18n>bpr.form.publication.licence.text</i18n>
                                    </h3>
                                    <ul>
                                      <li class="small-text">
                                        <i18n>bpr.form.publication.licence.text.1</i18n>
                                        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                                            target="_blank"
                                            class="left-spacing top-spacing">
                                            <img class="licence_image"
                                                src="assets/themes/entcore-css-lib/images/cc-by-nc-sa.svg"
                                                alt="[[translate('bpr.form.publication.licence.image.alt')]]" />
                                        </a>
                                      </li>
                                      <li class="small-text"><i18n>bpr.form.publication.licence.text.2</i18n></li>
                                      <li class="small-text"><i18n>bpr.form.publication.licence.text.3</i18n></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="row top-spacing-four">
                                <div class="cell twelve">
                                    <button type="submit"
                                        class="right-magnet"
                                        ng-disabled="libraryPublishController.invalidFormFields()">
                                        <i18n ng-if="!libraryPublishController.loading">publish</i18n>
                                        <i ng-if="libraryPublishController.loading" class="loading" style="margin: 0"></i>
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
                <lightbox class="bpr" show="libraryPublishController.showLightboxResponse" tiny="true">
                    <div ng-if="libraryPublishController.publicationResponse.success">
                        <h2><i18n>bpr.form.publication.response.success.title</i18n></h2>
                        <i class="congrats"></i>
                        <p>
                            <i18n>bpr.form.publication.response.success.content.1</i18n>
                        </p>
                        <p>
                            <i18n>bpr.form.publication.response.success.content.2</i18n>
                        </p>
                        <a ng-if="libraryPublishController.publicationResponse.details && libraryPublishController.publicationResponse.details.front_url" 
                            class="button right-magnet" 
                            ng-href="[[libraryPublishController.responseBprFullURL]]"
                            target="_blank">
                            <i18n>bpr.form.publication.response.success.button</i18n>
                        </a>
                    </div>

                    <div ng-if="!libraryPublishController.publicationResponse.success">
                        <h2><i18n>bpr.form.publication.response.error.title</i18n></h2>
                        <p><strong><i18n>bpr.form.publication.response.error.content</i18n></strong></p>
                    </div>
                </lightbox>
            </div>`
    };
});
