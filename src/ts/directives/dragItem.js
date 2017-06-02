"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
var ui_1 = require("../ui");
var max = {
    height: 300,
    width: 300
};
exports.dragItem = ng_start_1.ng.directive('dragItem', function () {
    return {
        restrict: 'A',
        // lier le scope au parent
        // pas de propriété scope
        link: function (scope, element, attributes) {
            var drag = scope.$eval(attributes.dragItem);
            var matchedElement = undefined;
            var firstTick = true;
            scope.$watch(function () {
                return scope.$eval(attributes.dragItem);
            }, function (newVal) {
                drag = newVal;
            });
            ui_1.ui.extendElement.draggable(element, {
                mouseUp: function (e) {
                    jquery_1.$(".droppable").off("mouseout");
                    //declencher l'evenement drop
                    jquery_1.$('body').removeClass('dragging');
                    if (matchedElement) {
                        matchedElement.trigger("drop", [drag]);
                    }
                    scope.$apply();
                    firstTick = true;
                    element.attr('style', '');
                    element.trigger('stopdrag');
                    element.removeClass('dragging');
                },
                startDrag: function (data) {
                    element.addClass('dragging');
                    if (element[0].hasAttribute('drag-crop')) {
                        var crop = {};
                        if (element.height() > max.height) {
                            var newHeight = max.height;
                            var maxDistance = (max.height / 2) - window.scrollY;
                            if (data.elementDistance.y > maxDistance) {
                                data.elementDistance.y = maxDistance;
                            }
                            else {
                                newHeight = data.elementDistance.y + (max.height / 2);
                            }
                            crop.height = newHeight;
                            element.css({
                                overflow: 'hidden'
                            });
                        }
                        if (element.width() > max.width) {
                            var newWidth = max.width;
                            var maxDistance = (max.width / 2);
                            if (data.elementDistance.x > maxDistance) {
                                data.elementDistance.x = maxDistance;
                            }
                            else {
                                newWidth = data.elementDistance.x + (max.width / 2);
                            }
                            crop.width = newWidth;
                            element.css({
                                overflow: 'hidden'
                            });
                        }
                        if (crop.height || crop.width) {
                            element.animate(crop);
                        }
                    }
                    return {
                        elementDistance: data.elementDistance
                    };
                },
                dragOver: function (item) {
                    item.addClass('dragover');
                    matchedElement = item;
                },
                dragOut: function (item) {
                    if (item[0] === matchedElement) {
                        matchedElement = undefined;
                    }
                    item.removeClass('dragover');
                },
                tick: function () {
                    if (firstTick) {
                        jquery_1.$('.droppable').removeClass('drag-over');
                        element.css({
                            'pointer-events': 'none'
                        });
                        element.trigger('startdrag');
                        jquery_1.$('body').addClass('dragging');
                        scope.$apply();
                        firstTick = false;
                    }
                }
            });
        }
    };
});
exports.dropItem = ng_start_1.ng.directive('dropItem', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            element.addClass('droppable');
            var dropConditionFn = $parse(attributes.dropcondition);
            element.on("dragover", function (event) {
                if (attributes.dropcondition === undefined || dropConditionFn(scope, {
                    $originalEvent: event.originalEvent
                })) {
                    event.preventDefault();
                    event.stopPropagation();
                    element.addClass("droptarget");
                }
            });
            element.on("dragout", function (event) {
                element.removeClass("droptarget");
            });
            element.on('drop', function (event, item) {
                scope.$eval(attributes.dropItem, {
                    $item: item
                });
                scope.$apply();
            });
        }
    };
});
//# sourceMappingURL=dragItem.js.map