import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';
import { ui } from '../ui';

let max = {
    height: 300,
    width: 300
};

export let dragItem = ng.directive('dragItem', function(){
	return{
		restrict: 'A',
		// lier le scope au parent
		// pas de propriété scope
		link: function(scope, element, attributes){
			var drag = scope.$eval(attributes.dragItem);
			var matchedElement = undefined;
            var firstTick = true;

            scope.$watch(function () {
                return scope.$eval(attributes.dragItem);
            }, function (newVal) {
                drag = newVal;
            });

			ui.extendElement.draggable(element, {
				mouseUp: function(e){
					$(".droppable").off("mouseout");
					//declencher l'evenement drop
					$('body').removeClass('dragging');
					if(matchedElement){
						matchedElement.trigger("drop", [drag]);
					}
					scope.$apply();
					firstTick = true;
                    element.attr('style', '');
                    element.trigger('stopdrag');
					element.removeClass('dragging');
				},
				startDrag: (data) => {
					element.addClass('dragging');
					if(element[0].hasAttribute('drag-crop')){
                        let crop: { height?: number, width?: number } = {};
						if(element.height() > max.height){
                            let newHeight = max.height;
                            let maxDistance = (max.height / 2) - window.scrollY;
                            if(data.elementDistance.y > maxDistance){
                                data.elementDistance.y = maxDistance;
                            }
                            else{
                                newHeight = data.elementDistance.y + (max.height / 2);
                            }
                            crop.height = newHeight;
							element.css({
								overflow: 'hidden'
							});
						}
                        if(element.width() > max.width){
                            let newWidth = max.width;
                            let maxDistance = (max.width / 2);
                            if(data.elementDistance.x > maxDistance){
                                data.elementDistance.x = maxDistance;
                            }
                            else{
                                newWidth = data.elementDistance.x + (max.width / 2);
                            }
							
                            crop.width = newWidth;
							element.css({
								overflow: 'hidden'
							});
						}
                        if(crop.height || crop.width){
                            element.animate(crop);
                        }
					}
					return {
						elementDistance: data.elementDistance
					};
				},
				dragOver: function(item){
                    item.addClass('dragover');
                    matchedElement = item;
                },
                dragOut: function(item){
                    if(item[0] === matchedElement){
                        matchedElement = undefined;
                    }
                    item.removeClass('dragover');
                },
                tick: function() {
                    if (firstTick) {
                        $('.droppable').removeClass('drag-over');
                        element.css({
                            'pointer-events': 'none'
                        });
                        element.trigger('startdrag');
                        $('body').addClass('dragging');
                        scope.$apply();

                        firstTick = false;
                    }
                }

			})


		}
	}
});

export let dropItem = ng.directive('dropItem', function($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            element.addClass('droppable');
            var dropConditionFn = $parse(attributes.dropcondition);
            element.on("dragover", function(event) {
                if (attributes.dropcondition === undefined || dropConditionFn(scope, {
                        $originalEvent: event.originalEvent
                    })) {
                    event.preventDefault();
                    event.stopPropagation();
                    element.addClass("droptarget")
                }
            });
            element.on("dragout", function(event) {
                element.removeClass("droptarget")
            });
            element.on('drop', function(event, item) {
                scope.$eval(attributes.dropItem, {
                    $item: item
                });
                scope.$apply();
            })
        }
    }
});