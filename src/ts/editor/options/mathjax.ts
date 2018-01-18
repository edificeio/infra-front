import { $ } from '../../libs/jquery/jquery';

export const mathjax = {
    name: 'mathjax', 
    run: function(instance){
        return {
            template: '<i ng-click="display.fillFormula = true" tooltip="editor.option.mathjax"></i>' +
            '<lightbox show="display.fillFormula" on-close="display.fillFormula = false;">' +
            '<textarea ng-model="display.formula"></textarea>' +
            '<mathjax formula="[[display.formula]]"></mathjax>' +
            '<div class="row">' +
            '<button type="button" ng-click="updateContent()" class="right-magnet"><i18n>apply</i18n></button>' +
            '<button type="button" ng-click="cancel()" class="right-magnet cancel"><i18n>cancel</i18n></button>' +
            '</div>' +
            '</lightbox>',
            link: function(scope, element, attributes){
                scope.display = {
                    formula: '{-b \\pm \\sqrt{b^2-4ac} \\over 2a}'
                };
                
                var editNode = undefined;
                
                scope.updateContent = function(){
                    if(editNode){
                        $(editNode).attr('formula', scope.display.formula);
                        angular.element(editNode.firstChild).scope().updateFormula(scope.display.formula);
                        instance.trigger('change');
                    }
                    else{
                        instance.selection.replaceHTMLInline(instance.compile(
                            '<span>&nbsp;<mathjax contenteditable="false" formula="'+ scope.display.formula + '"></mathjax>&nbsp;</span>'
                        )(scope));
                    }
                    
                    scope.display.fillFormula = false;
                    editNode = undefined;
                };
                
                scope.cancel = function(){
                    editNode = undefined;
                    scope.display.fillFormula = false;
                };
                
                instance.bindContextualMenu(scope, 'mathjax', [
                    {
                        label: 'editor.edit.mathjax',
                        action: function (e) {
                            instance.selection.selectNode(e.target);
                            scope.display.fillFormula = true;
                            scope.display.formula = $(e.target).attr('formula');
                            editNode = e.target;
                        }

                    },
                    {
                        label: 'editor.remove.mathjax',
                        action: function (e) {
                            $(e.target).remove();
                        }
                    }
                ]);
            }
        }
    }
};