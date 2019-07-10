import { EdumediaMediaDetails, edumediaService } from "../../edumedia/service";
import { MediaLibraryDelegate, Header } from "../../directives";
import { Element } from "../../workspace/model";
import { idiom } from "../../idiom";

interface EdumediaScope {
    isVisible: boolean
    delegate: MediaLibraryDelegate;
    onSelect($selected: EdumediaMediaDetails[]);
    open();
    close();
    cancel()
    updateContent();
    edumediaOptions: {
        display: {
            pickMedia: boolean,
            files: Element[],
        },
        visibility: 'protected' | "public"
    }
    $apply: any
}


export const edumedia = {
    name: 'edumedia',
    run: function (instance) {
        return {
            template: `
            <i class="ic-edumedia" ng-click="open()" ng-if="isVisible" tooltip="editor.option.edumedia"></i>
            <div ng-if="edumediaOptions.display.pickMedia">
                <lightbox show="edumediaOptions.display.pickMedia" on-close="cancel()">
                    <script type="text/ng-template" id="edumedia_explorer">
                        <edumedia-explorer on-select-medias="onSelectMedia($selection)"></edumedia-explorer>
                    </script>
                    <media-library delegate="delegate" ng-change="updateContent()" visibility="'external'" multiple="true" ng-model="edumediaOptions.display.files"></media-library>
                </lightbox>
            </div>
            `,
            link: function (scope: EdumediaScope, element, attributes) {
                scope.isVisible = false;
                const init = async () => {
                    const enabled = await edumediaService.isEdumediaEnabled();
                    scope.isVisible = enabled;
                    scope.$apply()
                }
                init();
                const HEADER_EDUMEDIA: Header = {
                    i18Key: "library.header.edumedia",
                    template: "local:edumedia_explorer",
                    visible: () => true,
                    worflowKey: null
                }
                let delegate: MediaLibraryDelegate = {
                    title: idiom.translate("library.title.edumedia"),
                    visit(mScope) {
                        mScope["onSelectMedia"] = function (selection) {
                            return scope.onSelect(selection);
                        }
                        setTimeout(() => {
                            mScope.showHeader(HEADER_EDUMEDIA);
                        })
                    },
                    augmentHeaders(headers: Header[]) {
                        const filter = headers.filter(h => h.i18Key.indexOf("browse") > -1);
                        return [HEADER_EDUMEDIA, ...filter]
                    },
                    filterDocumentRole(el) {
                        return edumediaService.hasEdumediaContentType(el);
                    }
                }
                scope.delegate = delegate;
                scope.onSelect = function ($selected: EdumediaMediaDetails[]) {
                    try {
                        let html = "";
                        $selected.forEach(s => {
                            html += `<br/><span contenteditable="false" class="edumedia-container">&#8203;${edumediaService.toHtml(s)}</span><br/>`;
                        })
                        instance.selection.replaceHTMLInline(html);
                        instance.focus();
                        window.getSelection().removeAllRanges();
                        const promises = $selected.map(s => edumediaService.saveIntoWorkspace(s));
                        return Promise.all(promises);
                    } finally {
                        scope.cancel();
                    }
                }
                scope.edumediaOptions = {
                    display: { pickMedia: false, files: [] },
                    visibility: 'protected'
                }
                scope.open = function () {
                    scope.edumediaOptions.display.pickMedia = true;
                }
                scope.cancel = function () {
                    scope.edumediaOptions.display.pickMedia = false;
                }
                scope.updateContent = async function () {
                    try {
                        let html = "";
                        const files = scope.edumediaOptions.display.files;
                        const promises = files.map(async s => {
                            const body = await edumediaService.fetchHtml(s);
                            html += `<br/><span contenteditable="false" class="edumedia-container">&#8203;${body}</span><br/>`;
                        })
                        await Promise.all(promises);
                        instance.selection.replaceHTMLInline(html);
                        instance.focus();
                        window.getSelection().removeAllRanges();
                    } finally {
                        scope.cancel();
                    }
                }
            }
        };
    }
}