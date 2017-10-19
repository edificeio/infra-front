import { ng } from '../ng-start';
import http from 'axios';
import { $ } from '../libs/jquery/jquery';

export let bindHtml = ng.directive('bindHtml', ['$compile', function($compile){
	return {
		restrict: 'A',
		scope: {
			bindHtml: '='
		},
		link: function(scope, element){
			scope.$watch('bindHtml', function(newVal){
				let htmlVal = $('<div>' + (newVal || '') + '</div>');
				htmlVal.find('[resizable]').removeAttr('resizable').css('cursor', 'initial');
				htmlVal.find('[bind-html]').removeAttr('bind-html');
				htmlVal.find('[ng-include]').removeAttr('ng-include');
				htmlVal.find('[ng-transclude]').removeAttr('ng-transclude');
                htmlVal.find('[draggable]').removeAttr('draggable').css('cursor', 'initial');
                htmlVal.find('[contenteditable]').removeAttr('contenteditable');
				htmlVal.find('script').remove();
				htmlVal.find('*').each((index, item: HTMLElement) => {
					let attributes = item.attributes;
					for(let i = 0; i < attributes.length; i++){
						if(attributes[i].name.startsWith('on')){
							item.removeAttribute(attributes[i].name);
						}
					}
				});
				let htmlContent = htmlVal[0].outerHTML;
				if (!window.MathJax && !(window as any).MathJaxLoading) {
					let script = $('<script></script>')
						.attr('src', '/infra/public/mathjax/MathJax.js')
						.appendTo('head');
						
						script[0].async = false;
						window.MathJax.Hub.Config({
							messageStyle: 'none',
							tex2jax: { preview: 'none' },
							jax: ["input/TeX", "output/CommonHTML"],
							extensions: ["tex2jax.js", "MathMenu.js", "MathZoom.js"],
							TeX: {
								extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"]
							}
						});
						window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
                }
				element.html($compile(htmlContent)(scope.$parent));
				//weird browser bug with audio tags
				element.find('audio').each(function(index, item){
					let parent = $(item).parent();
					$(item)
						.attr("src", item.src)
                        .attr('preload', 'none')
						.detach()
						.appendTo(parent);
				});

				let legend;
				element.on('mouseover', 'img', async (e) => {
					const src: string = $(e.target).attr('src');
					if(src.startsWith('/workspace/document')){
						let legendText;
						if($(e.target).data('legend')){
							legendText = $(e.target).data('legend');
						}
						else{
							const fileId = src.split('/workspace/document/')[1].split('?')[0];
							const response = await http.get('/workspace/document/properties/' + fileId);
							legendText = response.data.legend;
						}
						
						$(e.target).data('legend', legendText);
						legend = $(`<legend class="user-image"><div class="text">${legendText}</div></legend>`).appendTo('body');
						legend.height($(e.target).height());
						legend.width($(e.target).width());
						legend.offset({
							top: $(e.target).offset().top,
							left: $(e.target).offset().left
						});
					
						setTimeout(() => {
							const out = (e) => {
								legend.find('.text').addClass('hidden');
								setTimeout(() => legend.remove(), 250);
								element.off('mouseout');
							};

							element.on('mouseout', 'img', out);
							element.on('mouseout', out);
						}, 10)
					}
				});

				if(window.MathJax && window.MathJax.Hub){
					window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
				}
			});
		}
	}
}]);