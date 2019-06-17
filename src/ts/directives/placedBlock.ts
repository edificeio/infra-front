import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';

export const placedBlock = ng.directive('placedBlock', function(){
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		scope: {
			x: '=',
			y: '=',
			z: '=',
			h: '=',
			w: '=',
			ratio: '@' // W/H ratio that will be preserved when resized.
		},
		template: '<article ng-transclude ng-style="{\'z-index\': z }"></article>',
		link: function(scope, element){
			scope.$safeApply = function (fn?) {
                const phase = this.$root && this.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };


			element.css({ 'position': 'absolute' });
			scope.$watch('x', function(newVal){
				element.offset({
					top: element.offset().top,
					left: parseInt(newVal) + element.parents('.drawing-zone').offset().left
				});
			});

			scope.$watch('y', function(newVal){
				element.offset({
					left: element.offset().left,
					top: parseInt(newVal) + element.parents('.drawing-zone').offset().top
				});
			});

			var toTop = function(){
				$(':focus').blur();
				if(scope.z === undefined){
					return;
				}
				element.parents('.drawing-zone').find('article[draggable]').each(function(index, item){
					var zIndex = $(item).css('z-index');
					if(!scope.z){
						scope.z = 1;
					}
					if(parseInt(zIndex) && parseInt(zIndex) >= scope.z){
						scope.z = parseInt(zIndex) + 1;
					}
				});
				if(scope.z){
					scope.$apply('z');
				}
			};

			element.on('startDrag', () => {
				toTop();
				element.addClass("placed-block--dragging");
			});
			element.on('startResize', function(){
				scope.w = element.width();
				scope.$apply('w');
				scope.h = element.height();
				scope.$apply('h');
				toTop();
			});

            const applyPosition = () => {
                scope.x = element.position().left;
				scope.$apply('x');
				scope.y = element.position().top;
				scope.$apply('y');
            }

			element.on('stopDrag', () => {
				applyPosition();
				element.removeClass("placed-block--dragging");
			});

			scope.$watch('z', function(newVal){
				element.css({ 'z-index': scope.z })
			});

			element.on('stopResize', function(){
				scope.w = element.width();
				scope.$apply('w');
				scope.h = element.height();
				scope.$apply('h');
                applyPosition();
			});

			scope.$watch('w', function(newVal){
				element.width(newVal);
				if (scope.ratio) {
					scope.h = scope.w / scope.ratio;
					scope.$safeApply('h');
				}
			});

			scope.$watch('h', function(newVal){
				element.height(newVal);
				if (scope.ratio) {
					scope.w = scope.h * scope.ratio;
					scope.$safeApply('w');
				}
			});

			scope.$watch('ratio', function(newVal){
				console.log("new ratio", newVal);
				scope.h = scope.w / newVal;
			});
		}
	}
});