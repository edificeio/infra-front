import {Directive, ng} from "../../ng-start";
import {IScope, ITimeoutService} from "angular";
import {appPrefix} from "../../globals";
import {workspace} from "../../workspace";
import models = workspace.v2.models;
import {IVirtualMediaLibraryScope} from "./virtual-media-library.model";

interface IVirtualMediaLibrary {
    mediaServiceLibrary: IVirtualMediaLibraryScope;
    folders: Array<models.Element>;
    documents: Array<models.Element>;

    // thumbUrl img
    getThumbUrl(document: models.Element): string;

    filterDocument(search: string, documents: Array<models.Element>): void;
    setDocuments(folders?: Array<models.Element>, documents?: Array<models.Element>): void;
    updateSelection(document: models.Element): void;
}

class Controller implements ng.IController, IVirtualMediaLibrary {
    public mediaServiceLibrary: IVirtualMediaLibraryScope;
    public folders: Array<models.Element>;
    public documents: Array<models.Element>;
    private isMultiple: boolean;
    private fileFormat: string;

    constructor(private $scope: IScope, private $timeout: ITimeoutService) {
        this.isMultiple = false;
        this.fileFormat = "";
        this.mediaServiceLibrary = {} as IVirtualMediaLibraryScope;
        this.folders = [];
        this.documents = [];
    }

    $onInit() {
        this.isMultiple = this.$scope.$parent['multiple'];
        this.fileFormat = this.$scope.$parent['fileFormat'];
        this.$timeout(() => {
            this.mediaServiceLibrary = this.$scope['vm']['selectedVirtualFolder'];
            this.setDocuments();
        });
    }

    updateSelection(document: models.Element): void {
        if (!this.isMultiple) {
            this.documents.forEach((d: models.Element) => d.selected = false);
            document.selected = true;
        }
    }

    setDocuments(folders?: Array<models.Element>, documents?: Array<models.Element>): void {
        if (folders && documents) {
            this.folders = folders;
            this.documents = this.filterDocumentByFormat(documents);
        } else if (this.mediaServiceLibrary) {
            this.folders = (<Array<models.Element>>this.mediaServiceLibrary.folders);
            this.documents = this.filterDocumentByFormat((<Array<models.Element>>this.mediaServiceLibrary.documents));
        } else {
            this.folders = [];
            this.documents = [];
        }
    }

    filterDocument(search: string): void {
        if (search && search.trim().length > 0) {
            this.folders = (<Array<models.Element>>this.mediaServiceLibrary.folders.filter((f: models.Element) => f.name.toLowerCase()
                .includes(search.toLowerCase())));
            this.documents = this.filterDocumentByFormat((<Array<models.Element>>this.mediaServiceLibrary.documents.filter((f: models.Element) => f.name.toLowerCase()
                .includes(search.toLowerCase()))));
        } else {
            this.setDocuments();
        }
    }

    filterDocumentByFormat(documents: Array<models.Element>): Array<models.Element> {
        if (this.fileFormat === 'any') {
            return documents;
        }
        return documents.filter((document : models.Element) =>
            (typeof document.role === "function" && (document.role() === this.fileFormat)) ||
            ((<any>document).role === this.fileFormat));
    }

    getThumbUrl(document: models.Element): string {
        return typeof document.thumbUrl === "function" ? document.thumbUrl() : (<any>document).thumbUrl;
    }

    getRole(document: models.Element): string {
        return typeof document.role === "function" ? document.role() : (<any>document).role;
    }

    safeApply(): void {
        let phase: any = this.$scope.$root.$$phase;
        if (phase !== '$apply' && phase !== '$digest') {
            this.$scope.$apply();
        }
    }
}

function directive() {
    return {
        restrict: 'E',
        templateUrl: '/' + appPrefix + '/public/template/entcore/media-library/virtual-media-library/virtual-media-content.html',
        scope: {
            selectedVirtualFolder: "=",
            search: "="
        },
        controllerAs: 'vm',
        bindToController: true,
        controller: ['$scope', '$timeout', Controller],
        link: function (scope: ng.IScope,
                        element: ng.IAugmentedJQuery,
                        attrs: ng.IAttributes,
                        vm: ng.IController) {

            scope.$watchGroup(['vm.selectedVirtualFolder.folders', 'vm.selectedVirtualFolder.documents'],
                (newValues: [Promise<Array<models.Tree>>, Promise<Array<models.Tree>>],
                 oldValues: [Promise<Array<models.Tree>>, Promise<Array<models.Tree>>], scope: IScope) => {
                if (newValues !== oldValues) {
                    vm.setDocuments(newValues[0], newValues[1]);
                }
                vm.safeApply(scope);
            });

            scope.$watch("vm.search", (newValue: string, oldValue: string) => {
                if (newValue !== oldValue) {
                    vm.filterDocument(newValue);
                    vm.safeApply(scope);
                }
            });
        }
    }
}
export const virtualMediaLibraryDocumentView: Directive = ng.directive('virtualMediaLibraryDocumentView', directive);