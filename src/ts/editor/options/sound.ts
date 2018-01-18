export const sound = {
    name: 'sound',
    run: function(instance){
        return {
            template: '<i ng-click="soundOption.display.pickFile = true" tooltip="editor.option.sound"></i>' +
            '<div ng-if="soundOption.display.pickFile">' +
            '<lightbox show="soundOption.display.pickFile" on-close="soundOption.display.pickFile = false;">' +
            '<media-library ng-change="updateContent()" ng-model="soundOption.display.file" file-format="\'audio\'" visibility="soundOption.visibility"></media-library>' +
            '</lightbox>' +
            '</div>',
            link: function(scope, element, attributes){
                instance.editZone.addClass('drawing-zone');
                scope.soundOption = {
                    display: { pickFile: false },
                    visibility: 'protected'
                }

                if (instance.visibility === 'public') {
                    scope.soundOption.visibility = 'public'
                }
                scope.updateContent = function () {
                    var path = '/workspace/document/';
                    if (scope.soundOption.visibility === 'public') {
                        path = '/workspace/pub/document/';
                    }

                    instance.selection.replaceHTML(
                        '<div><br /></div>' +
                        '<div class="audio-wrapper"><audio src="' + path + scope.soundOption.display.file._id + '" controls preload="none"></audio></div>' +
                        '<div><br /></div>'
                    );
                    scope.soundOption.display.pickFile = false;
                    scope.soundOption.display.file = undefined;
                };
            }
        }
    }
};