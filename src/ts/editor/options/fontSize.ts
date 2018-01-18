export const fontSize = {
    name: 'fontSize',
    run: function(instance) {
        return {
            template: '<select-list placeholder="size" display="font.fontSize.size" tooltip="editor.option.fontSize">' +
            '<opt ng-repeat="fontSize in font.fontSizes" ng-click="setSize(fontSize)" ' +
                'ng-style="{ \'font-size\': fontSize.size + \'px\', \'line-height\': fontSize.size + \'px\'}">' +
                    '[[fontSize.size]]' +
                '</opt>' +
            '</select-list>',
            link: function (scope, element, attributes) {
                scope.font = {
                    fontSizes: [{ size: 8 }, { size: 10 }, { size: 12 }, { size: 14 },
                        { size: 16 }, { size: 18 }, { size: 20 }, { size: 24 }, { size: 28 },
                        { size: 34 }, { size: 42 }, { size: 64 }, { size: 72 }],
                    fontSize: {}
                };

                scope.setSize = function (fontSize) {
                    scope.font.fontSize = { size: fontSize.size };
                    instance.selection.css({
                        'font-size': fontSize.size + 'px',
                        'line-height': fontSize.size + 'px'
                    });
                };

                instance.on('selectionchange', function (e) {
                    if (instance.selection.css('font-size')) {
                        scope.font.fontSize = { size: parseInt(instance.selection.css('font-size')) };
                    }
                    else {
                        scope.font.fontSize = { size: undefined };
                    }

                });

                element.children('.options').on('click', 'opt', function () {
                    element.children('.options').addClass('hidden');
                });
            }
        }
    }
};