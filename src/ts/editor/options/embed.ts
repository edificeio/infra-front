export const embed = {
    name: 'embed',
    run: function (instance) {
        return {
            template: '<i ng-click="display.copyEmbed = true" tooltip="editor.option.embed"></i>' +
            '<embedder hidden-share-video-code=' + instance.hiddenShareVideoCode + ' ng-model="display.htmlCode" on-change="applyHtml()" show="display.copyEmbed"></embedder>',
            link: function (scope, element, attributes) {
                scope.display = {
                    htmlCode: ''
                };

                scope.applyHtml = function (template) {
                    instance.selection.replaceHTML(scope.display.htmlCode);
                };
            }
        }
    }
};