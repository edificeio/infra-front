export const undo = {
    name: 'undo',
    run: (instance) => {
        return {
            template: '<i tooltip="editor.option.undo"></i>',
            link: function(scope, element, attributes){
                element.addClass('disabled');
                element.on('click', function(){
                    instance.undo();
                    if(instance.stateIndex === 0){
                        element.addClass('disabled');
                    }
                    else{
                        element.removeClass('disabled');
                    }
                    instance.trigger('change');
                });

                instance.on('contentupdated', function(e){
                    if(instance.stateIndex === 0){
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