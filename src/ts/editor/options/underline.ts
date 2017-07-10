export const underline = {
    name: 'underline',
    run: function(instance){
        return {
            mobile: false,
            template: '<i tooltip="editor.option.underline"></i>',
            link: function(scope, element, attributes){
                element.on('click', function(){
                    if (document.queryCommandState('underline')) {
                        instance.execCommand('underline');
                        element.removeClass('toggled');
                    }
                    else {
                        instance.selection.css({ 'text-decoration': 'underline' });
                        element.addClass('toggled');
                    }
                });

                instance.on('selectionchange', function(e){
                    if(document.queryCommandState('underline')){
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