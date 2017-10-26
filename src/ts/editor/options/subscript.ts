export const subscript = {
    name: 'subscript',
    run: function (instance) {
        return {
            template: '<i tooltip="editor.option.subscript"></i>',
            link: function (scope, element, attributes) {
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }

                    if (instance.selection.css('vertical-align') !== 'sub') {
                        element.addClass('toggled');
                        instance.selection.css({ 'vertical-align': 'sub', 'font-size': '12px' });
                    }
                    else {
                        element.removeClass('toggled');
                        instance.selection.css({ 'vertical-align': '', 'font-size': '' });
                    }
                });

                instance.on('selectionchange', function (e) {
                    if (instance.selection.css('vertical-align') === 'sub') {
                        element.addClass('toggled');
                    }
                    else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const superscript = {
    name: 'superscript',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.superscript"></i>',
            link: function (scope, element, attributes) {
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }
    
                    if (instance.selection.css('vertical-align') !== 'super') {
                        element.addClass('toggled');
                        instance.selection.css({ 'vertical-align': 'super', 'font-size': '12px' });
                    }
                    else {
                        element.removeClass('toggled');
                        instance.selection.css({ 'vertical-align': '', 'font-size': '' });
                    }
                });
    
                instance.on('selectionchange', function (e) {
                    if (instance.selection.css('vertical-align') === 'super') {
                        element.addClass('toggled');
                    }
                    else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};