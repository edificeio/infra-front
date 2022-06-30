import {Directive, ng} from "../../ng-start";
import {IScope, ITimeoutService} from "angular";
import {IVirtualMediaLibraryScope} from "./virtual-media-library.model";
import {Document} from "../../workspace";

interface IVirtualMediaLibrary {
    mediaServiceLibrary: IVirtualMediaLibraryScope;
    onAddDocuments(): Promise<void>;
    loading: boolean;
}

class Controller implements ng.IController, IVirtualMediaLibrary {
    public mediaServiceLibrary: IVirtualMediaLibraryScope;
    public loading: boolean;
    private fileFormat: string;
    private copiedDocuments: Array<Document>;

    constructor(private $scope: IScope, private $timeout: ITimeoutService) {
        this.mediaServiceLibrary = null;
        this.fileFormat = "";
        this.loading = false;
        this.copiedDocuments = [];
    }

    $onInit() {
        this.fileFormat = this.$scope.$parent['fileFormat'];
        this.$timeout(() => this.mediaServiceLibrary = this.$scope['vm']['selectedVirtualFolder']);
    }

    $onDestroy() {
        this.mediaServiceLibrary.clearCopiedDocumentsAfterSelect(this.copiedDocuments);
    }

    selectedDocuments(): Array<Document> {
        const selectedVirtualFolder: IVirtualMediaLibraryScope = this.$scope['vm'].selectedVirtualFolder;
        return selectedVirtualFolder.documents ?
            this.filterDocumentByFormat(selectedVirtualFolder.documents).filter((d: Document) => d.selected) : [];
    }

    filterDocumentByFormat(documents: Array<Document>): Array<Document> {
        if (this.fileFormat === 'any') {
            return documents;
        }
        return documents.filter((document: Document) =>
            (typeof document.role === "function" && (document.role() === this.fileFormat)) ||
            ((<any>document).role === this.fileFormat));
    }

    async onAddDocuments(): Promise<void> {
        this.loading = true;
        try {
            this.copiedDocuments = await this.mediaServiceLibrary.onSelectVirtualDocumentsBefore(this.selectedDocuments());
            this.copiedDocuments.forEach((d: Document) => {
                d.selected = true;
                this.$scope['vm']['documents'].push(d);
            });
            this.$scope.$eval(this.$scope['vm']['onClick']());
        } catch (e) {
            const message: string = "Error while attempting to add documents children: ";
            console.error(message + e.message);
        }
        this.loading = false;
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
        template: `
            <button type="button" class="right-magnet" ng-disabled="vm.loading || vm.selectedDocuments().length === 0" ng-click="vm.onAddDocuments()">
                <i18n>library.browse.add</i18n>
            </button>`,
        scope: {
            documents: "=",
            folders: "=",
            selectedVirtualFolder: "=",
            onClick: "&"
        },
        controllerAs: 'vm',
        bindToController: true,
        controller: ['$scope', '$timeout', Controller],
        link: function (scope: ng.IScope,
                        element: ng.IAugmentedJQuery,
                        attrs: ng.IAttributes,
                        vm: ng.IController) {
        }
    }
}

export const virtualMediaLibraryButton: Directive = ng.directive('virtualMediaLibraryButton', directive);