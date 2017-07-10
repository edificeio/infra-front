import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { $ } from '../libs/jquery/jquery';

export const fileViewer = ng.directive('fileViewer', function(){
	return {
		restrict: 'E',
		scope: {
			ngModel: '='
		},
		templateUrl: '/' + appPrefix + '/public/template/entcore/file-viewer.html',
		link: function(scope, element, attributes){
			scope.contentType = scope.ngModel.metadata.role;
			scope.isFullscreen = false;

			scope.download = function(){
				window.location.href = scope.ngModel.link;
			};
			var renderElement;
			var renderParent;
			scope.fullscreen = function(allow){
				scope.isFullscreen = allow;
				if(allow){
					var container = $('<div class="fullscreen-viewer"></div>');
					container.hide();
					container.on('click', function(e){
						if(!$(e.target).hasClass('render')){
							scope.fullscreen(false);
							scope.$apply('isFullscreen');
						}
					});
					element.children('.embedded-viewer').addClass('fullscreen');
					renderElement = element
						.find('.render');
					renderParent = renderElement.parent();

					renderElement
						.addClass('fullscreen')
						.appendTo(container);
					container.appendTo('body');
					container.fadeIn();
					if(typeof scope.render === 'function'){
						scope.render();
					}
				}
				else{
					renderElement.removeClass('fullscreen').appendTo(renderParent);
					element.children('.embedded-viewer').removeClass('fullscreen');
					var fullscreenViewer = $('body').find('.fullscreen-viewer');
					fullscreenViewer.fadeOut(400, function(){
						fullscreenViewer.remove();
					});

					if(typeof scope.render === 'function'){
						scope.render();
					}
				}
			}
		}
	}
});