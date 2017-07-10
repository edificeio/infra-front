export const italic = {
    name: 'italic',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.italic"></i>',
            link: function(scope, element, attributes){
                element.on('click', function(){
                    if(!instance.editZone.is(':focus')){
                        instance.focus();
                    }

                    if(document.queryCommandState('italic')){
                        element.removeClass('toggled');
                        instance.selection.css({ 'font-style': 'normal' });
                    }
                    else{
                        element.addClass('toggled');
                        instance.selection.css({ 'font-style': 'italic' });
                    }
                });

                instance.on('selectionchange', function(e){
                    if(document.queryCommandState('italic')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
}