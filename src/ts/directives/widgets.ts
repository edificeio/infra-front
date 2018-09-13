import { ng, Directive } from '../ng-start';
import { appPrefix } from '../globals';
import { model } from '../modelDefinitions';
import { $ } from "../libs/jquery/jquery";

export const widgets = ng.directive('widgets', ['$compile', ($compile) => {
	return {
		scope: {
			list: '='
		},
		restrict: 'E',
		templateUrl: '/' + appPrefix + '/public/template/entcore/widgets.html',
		link: function(scope, element, attributes){
			element.on('index-changed', '.widget-container', function(e){
				var widgetObj = angular.element(e.target).scope().widget;
				element.find('.widget-container').each(function(index, widget){
					if(e.target === widget){
						return;
					}
					if($(e.target).offset().top + ($(e.target).height() / 2) > $(widget).offset().top &&
						$(e.target).offset().top + ($(e.target).height() / 2) < $(widget).offset().top + $(widget).height()){
						widgetObj.setIndex(index);
						scope.$apply('widgets');
					}
					//last widget case
					if($(e.target).offset().top > $(widget).offset().top + $(widget).height() && index === element.find('.widget-container').length - 1){
						widgetObj.setIndex(index);
						scope.$apply('widgets');
					}
					//first widget case
					if($(e.target).offset().top + $(e.target).height() > $(widget).offset().top && index === 0){
						widgetObj.setIndex(index);
						scope.$apply('widgets');
					}
				});
				element.find('.widget-container').css({ position: 'relative', top: '0px', left: '0px' });
			});
			model.widgets.on('change', function(){
				if(element.find('.widget-container').length === 0){
					element
						.parents('.widgets')
						.next('.widgets-friend')
						.addClass('widgets-enemy');
					element.parents('.widgets').addClass('hidden');
				}
				else{
					element
						.parents('.widgets')
						.next('.widgets-friend')
						.removeClass('widgets-enemy');
					element.parents('.widgets').removeClass('hidden');
				}
			});
		}
	}
}]);