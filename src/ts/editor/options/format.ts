import { $ } from '../../libs/jquery/jquery';

export const format = {
    name: 'format',
    run: function(instance) {
        return {
            template: '<select-list model="format" placeholder="editor.format.paragraph" display-as="label" display="format" tooltip="editor.option.format">' +
            '<opt ng-repeat="format in formats" value="format" ng-click="wrap(format)"><div>' +
            '<p ng-if="format.apply.tag === \'p\'" ng-class="format.apply.classes" translate content="[[format.label]]"></p>' +
            '<h1 ng-if="format.apply.tag === \'h1\'" translate content="[[format.label]]"></h1>' +
            '<h2 ng-if="format.apply.tag === \'h2\'" translate content="[[format.label]]"></h2>' +
            '<h3 ng-if="format.apply.tag === \'h3\'" translate content="[[format.label]]"></h3>' +
            '</div></opt>' +
            '</select-list>',
            link: function(scope, element, attributes){
                scope.formats = [
                    {
                        apply: { tag: 'p' },
                        label: 'editor.format.paragraph'
                    },
                    {
                        apply: { tag: 'h1' },
                        label: 'editor.format.title1'
                    },
                    {
                        apply: { tag: 'h2' },
                        label: 'editor.format.title2'
                    },
                    {
                        apply: { tag: 'h3' },
                        label: 'editor.format.title3'
                    },
                    {
                        apply: { tag: 'p', classes: ['info'] },
                        label: 'editor.format.info'
                    },
                    {
                        apply: { tag: 'p', classes: ['warning'] },
                        label: 'editor.format.warning'
                    }
                ];

                instance.on('selectionchange', function (e) {
                    if(!e){
                        return;
                    }
                    var testElement = e.selection.$();
                    if (instance.selection.isEmpty()) {
                        testElement = instance.selection.elementAtCaret();
                    }
                    var found = false;
                    scope.formats.forEach(function (format) {
                        var hasClass = true;
                        if (format.apply.classes) {
                            format.apply.classes.forEach(function (className) {
                                hasClass = hasClass && testElement.hasClass(className);
                            });
                        }

                        if (testElement.is(format.apply.tag) && hasClass) {
                            scope.format = format;
                            found = true;
                        }
                    });
                    if(!found){
                        scope.format = scope.formats[0];
                    }
                });

                scope.wrap = function (format) {
                    scope.format = format;
                    var newEl = $('<' + scope.format.apply.tag + '></' + scope.format.apply.tag + '>');
                    if(scope.format.apply.classes){
                        scope.format.apply.classes.forEach(function(element){
                            newEl.addClass(element);
                        });
                    }

                    instance.selection.wrap(newEl);
                }
            }
        }
    }
}