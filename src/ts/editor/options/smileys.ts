export const smileys = {
    name: 'smileys',
    run: function(instance){
        return {
            template: '' +
            '<i tooltip="editor.option.smileys"></i>' +
            '<lightbox show="display.pickSmiley" on-close="display.pickSmiley = false;">' +
            '<h2>Insérer un smiley</h2>' +
            '<div class="row smileys">' +
            '<img ng-repeat="smiley in smileys" class="smiley" ng-click="addSmiley(smiley)" skin-src="/img/smileys/[[smiley]].png" />' +
            '</div>' +
            '</lightbox>',
            link: function(scope, element, attributes){
                scope.display = {};
                scope.smileys = [ "happy", "proud", "dreamy", "love", "tired", "angry", "worried", "sick", "joker", "sad" ];
                scope.addSmiley = function (smiley) {
                    //do not replace with i, as i is used by other websites for italic and
                    //is often copy-pasted in the editor
                    var content = instance.compile(
                        '<img skin-src="/img/smileys/' + smiley + '.png" class="smiley" />'
                    )(scope.$parent);
                    instance.selection.replaceHTMLInline(content);
                    let sel = window.getSelection();
                    sel.getRangeAt(0).collapse(false); // Put after the selected smiley.
                    scope.display.pickSmiley = false;
                    instance.focus();
                }

                element.children('i').on('click', function(){
                    scope.display.pickSmiley = true;
                });
            }
        };
    }
};