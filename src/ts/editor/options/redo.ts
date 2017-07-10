export const redo = {
    name: 'redo',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.redo"></i>',
            link: function(scope, element, attributes){
                element.addClass('disabled');
                element.on('click', function(){
                    instance.redo();
                    if(instance.stateIndex === instance.states.length){
                        element.addClass('disabled');
                    }
                    else{
                        element.removeClass('disabled');
                    }
                    instance.trigger('change');
                });

                instance.on('contentupdated', function(e){
                    if (instance.stateIndex === instance.states.length) {
                        element.addClass('disabled');
                    }
                    else{
                        element.removeClass('disabled');
                    }
                });
            }
        };
    }
};