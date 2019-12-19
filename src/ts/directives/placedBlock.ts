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
			transformX: '=?', // A transform function for the X coordinate: transformX(x: number, reverseTransform: boolean): number
			transformY: '=?', // A transform function for the Y coordinate: transformY(y: number, reverseTransform: boolean): number
			transformZ: '=?', // A transform function for the Z coordinate: transformZ(z: number, reverseTransform: boolean): number
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

			let xUpdate = function(newVal)
			{
				let left = scope.transformX != null ? scope.transformX(parseInt(newVal), false) : parseInt(newVal);

				if(left == null)
				{
					window.setTimeout(function()
					{
						xUpdate(newVal);
					});
				}
				else
				{
					element.offset({
						top: element.offset().top,
						left: left + element.parents('.drawing-zone').offset().left,
					}, 0);
				}
			};
			scope.$watch('x', xUpdate);

			let yUpdate = function(newVal)
			{
				let top = scope.transformY != null ? scope.transformY(parseInt(newVal), false) : parseInt(newVal);

				if(top == null)
				{
					window.setTimeout(function()
					{
						yUpdate(newVal);
					}, 0);
				}
				else
				{
					element.offset({
						left: element.offset().left,
						top: top + element.parents('.drawing-zone').offset().top,
					});
				}
			};
			scope.$watch('y', yUpdate);

			scope.$watch('z', function(newVal){
				element.css({ 'z-index': scope.transformZ != null ? scope.transformZ(scope.z) : scope.z })
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
				scope.y = element.position().top;

				if(scope.transformX != null)
					scope.x = scope.transformX(scope.x, true);

				if(scope.transformY != null)
					scope.y = scope.transformY(scope.y, true);

				scope.$apply();
      }

			element.on('stopDrag', () => {
				applyPosition();
				element.removeClass("placed-block--dragging");
			});

			element.on('resizing', (e: Event) => {
				// console.log("on resizing ", e);
				scope.$emit('resizing', {
					target: element.get(0),
					w: element.width(),
					h: element.height()
				});
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
				if (newVal) { // Can be NaN
					console.log("new ratio", newVal);
					scope.h = scope.w / newVal;
					scope.$safeApply('h');
				}
			});
		}
	}
});