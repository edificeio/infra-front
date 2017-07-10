export const bold = {
    name: 'bold',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.bold"></i>',
            link: function(scope, element, attributes){
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }

                    if (document.queryCommandState('bold')) {
                        element.removeClass('toggled');
                        instance.selection.css({ 'font-weight': 'normal' });
                    }
                    else {
                        element.addClass('toggled');
                        instance.selection.css({ 'font-weight': 'bold' });
                    }
                });

                instance.on('selectionchange', function (e) {
                    if (document.queryCommandState('bold')) {
                        element.addClass('toggled');
                    }
                    else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
}