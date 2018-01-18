export const removeFormat = {
    name: 'removeFormat',
    run: function (instance) {
        return {
            template: '<i tooltip="editor.option.removeformat"></i>',
            link: function (scope, element, attributes) {
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }

                    var format = {
                        'font-style': 'normal',
                        'background-color': 'transparent',
                        'font-weight': 'normal',
                        'text-decoration': 'none',
                        'color': 'inherit',
                        'font-size': 'initial',
                        'line-height': 'initial',
                        'font-family': 'inherit'
                    };

                    instance.selection.css(format);
                    instance.execCommand('removeFormat');
                    instance.trigger('selectionchange', { selection: instance.selection });
                });

                instance.on('selectionchange', function (e) {
                    if (document.queryCommandEnabled('removeFormat')) {
                        element.removeClass('disabled');
                    }
                    else {
                        element.addClass('disabled');
                    }
                });
            }
        };
    }
};