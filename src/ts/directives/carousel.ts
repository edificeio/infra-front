import { appPrefix } from '../globals';
import { ng } from '../ng-start';

export let carousel = ng.directive('carousel', function(){
	return {
		scope: {
			items: '='
		},
		restrict: 'E',
		templateUrl: '/' + appPrefix + '/public/template/entcore/carousel.html',
		link: function(scope, element, attributes){
			var interrupt = 0;
			if(attributes.transition){
				element.addClass(scope.$parent.$eval(attributes.transition));
			}
			if(attributes.buttons){
				element.addClass(scope.$parent.$eval(attributes.buttons));
			}

			scope.current = {
				image: scope.items[0],
				index: 0
			};
			scope.images = scope.items.filter((item) => {
				return item.icon !== undefined;
			});
			scope.$watchCollection('items', function(newVal){
				scope.images = scope.items.filter((item) => {
					return item.icon !== undefined;
				});
				scope.current = {
					image: scope.items[0],
					index: 0
				};
			});
			scope.openCurrentImage = function(){
				window.location.href = scope.current.image.link;
			};
			scope.openSelectImage = function(item, index){
				if(scope.current.image === item){
					scope.openCurrentImage();
				}
				else{
					scope.current.image = item;
					scope.current.index = index;
				}
				cancelAnimationFrame(animrequest);
				imageHeight();
				interrupt --;
				setTimeout(infiniteRun, 5000);
			};
			scope.getPilePosition = function(index){
				if(index < scope.current.index){
					return 100 + index;
				}
				else{
					return 100 - index;
				}
			};
			var animrequest;
			var imageHeight = function(){
				element.find('.current img').height(element.find('.current .image-container').height());
				animrequest = requestAnimationFrame(imageHeight);
			}
			var infiniteRun = function(){
				cancelAnimationFrame(animrequest);
				if(interrupt < 0){
					interrupt ++;
					return;
				}
				scope.current.index ++;
				if(scope.current.index === scope.items.length){
					scope.current.index = 0;
				}
				scope.current.image = scope.items[scope.current.index];
				scope.$apply('current');

				imageHeight();

				setTimeout(infiniteRun, 4000);
			};
            setTimeout(() => {
                infiniteRun();
            }, 1);
		}
	}
});