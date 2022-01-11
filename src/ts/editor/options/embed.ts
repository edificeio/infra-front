export const embed = {
    name: 'embed',
    run: function (instance) {
        if(!instance.hiddenShareVideoCode) {
            return {
                template: `
                    <i ng-click="display.copyEmbed = true" tooltip="editor.option.embed"></i>
                    <toast-onboarding
                        ng-if="display.toast"
                        show="display.copyEmbed" 
                        confirm="handleOnboardingConfirm()"
                    >
                    </toast-onboarding>
                    <embedder
                        file-format="\'video\'" 
                        hidden-share-video-code='${instance.hiddenShareVideoCode}' 
                        ng-model="display.htmlCode" 
                        ng-change="applyHtml()" 
                        ng-if="display.copyEmbed" 
                        show="display.copyEmbed"
                        selected-header="display.selectedHeader"
                    >
                    </embedder>
                `,
                link: function (scope, element, attributes) {
                    scope.display = {
                        htmlCode: '',
                        copyEmbed: false,
                        selectedHeader: '',
                        toast: instance.showOnboardingVideo
                    };
                    scope.applyHtml = function (template) {
                        instance.selection.replaceHTML(scope.display.htmlCode);
                        scope.display.copyEmbed = false;
                    };
                    scope.handleOnboardingConfirm = function () {
                        scope.display.selectedHeader = 'video.header.record';                    }
                }
            }
        } else {
            return {
                template: '',
                link: function (scope, element, attributes) {}
            }
        }
    }
};