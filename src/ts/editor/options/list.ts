export const ulist = {
    name: 'ulist',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.ulist"></i>',
            link: function(scope, element, attributes){
                element.on('mousedown', function () {

                    if(!instance.editZone.is(':focus')){
                        instance.editZone.focus();
                    }

                    if (instance.editZone.children('div').length === 0) {
                        instance.editZone.append('<div><br></div>');
                        instance.editZone.focus();
                    }

                    instance.execCommand('insertUnorderedList', false, null);
                    if(document.queryCommandState('insertUnorderedList')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });

                instance.on('selectionchange', function(e){
                    if(document.queryCommandState('insertUnorderedList')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const olist = {
    name: 'olist',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.olist"></i>',
            link: function(scope, element, attributes){
                element.on('mousedown', function(){
                    if(!instance.editZone.is(':focus')){
                        instance.editZone.focus();
                    }

                    if (instance.editZone.children('div').length === 0) {
                        instance.editZone.append('<div><br></div>');
                        instance.editZone.focus();
                    }

                    instance.execCommand('insertOrderedList', false, null);
                    if(document.queryCommandState('insertOrderedList')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });

                instance.on('selectionchange', function(e){
                    if(document.queryCommandState('insertOrderedList')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};