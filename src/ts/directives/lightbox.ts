import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';
import { _ } from '../libs/underscore/underscore';

export let lightbox = ng.directive('lightbox', () => {
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			show: '=',
			onClose: '&'
		},
		template: '<section class="lightbox">' +
						'<div class="background"></div>' +
						'<div class="content">' +
							'<div class="twelve cell" ng-transclude></div>'+
							'<div class="close-lightbox">'+
							'<i class="close-2x"></i>'+
							'</div>'+
						'</div>'+
					'</section>'+
				'</div>',
		link: function(scope, element, attributes){
			element.children('.lightbox').find('> .background').on('click', function(e){
				if (element.children('.lightbox').find('image-editor, share-panel, .import-files, .split-screen, [template=entcore\\/image-editor\\/main]').length === 0){
					element.children('.lightbox').first().fadeOut();
					$('body').css({ overflow: 'auto' });
					$('body').removeClass('lightbox-opened');

					scope.$eval(scope.onClose);
					scope.$apply();
					scope.show = false;
					if(!scope.$$phase){
						scope.$parent.$apply();
					}
				}
			});
			element.children('.lightbox').find('> .content > .close-lightbox > i.close-2x').on('click', function(e){
				if (element.children('.lightbox').find('share-panel').length === 0){
					element.children('.lightbox').first().fadeOut();
					$('body').css({ overflow: 'auto' });
					$('body').removeClass('lightbox-opened');

					scope.$eval(scope.onClose);
					scope.$apply();
					scope.show = false;
					if(!scope.$$phase){
						scope.$parent.$apply();
					}
				}
			});
			element.children('.lightbox').on('mousedown', function(e){
				e.stopPropagation();
			});

			scope.$watch('show', function(newVal){
                if (newVal) {
					element.trigger('lightboxvisible');
                    var lightboxWindow = element.children('.lightbox');

                    //Backup overflow hidden elements + z-index of parents
                    var parentElements = element.parents();

                    scope.backup = {
                        overflow: _.filter(parentElements, function(parent) {
                            return $(parent).css('overflow-x') !== 'visible' || $(parent).css('overflow-y') !== 'visible'
                        }),
                        zIndex: _.map(parentElements, function (parent) {
                                var index = '';
                                if($(parent).attr('style') && $(parent).attr('style').indexOf('z-index') !== -1){
                                    index = $(parent).css('z-index')
                                }
                                return {
                                    element: $(parent),
                                    index: index
                                }
                            })
                    };

                    //Removing overflow properties
				    scope.backup.overflow.forEach((element) => {
				        $(element).css({ 'overflow': 'visible' })
				    });

                    //Ensuring proper z-index
                    scope.backup.zIndex.forEach((elementObj) => {
                        elementObj.element.css('z-index', 99999)
                    })

					setTimeout(() => {
						if(element.parents('header.main').length === 0){
							$('body').addClass('lightbox-opened');
						}
						
						lightboxWindow.fadeIn();
					}, 100);

					$('body').css({ overflow: 'hidden' });
				}
                else {
					let updateBody = true;
					$('lightbox .lightbox').each((index, item) => {
						if(item !== element.children('.lightbox')[0] && $(item).css('display') === 'block'){
							updateBody = false;
						}
					});

					if(updateBody){
						$('body').removeClass('lightbox-opened');
						$('body').css({ overflow: 'auto' });
					}

                    if(scope.backup){
                        //Restoring stored elements properties
                        scope.backup.overflow.forEach((element) => {
                            $(element).css('overflow', '')
                        })
                        scope.backup.zIndex.forEach((elementObj) => {
                            elementObj.element.css('z-index', elementObj.index)
                        })
                    }

					element.children('.lightbox').fadeOut();
				}
			});

            scope.$on("$destroy", function () {
				if(element.parents('lightbox').length){
					return;
				}
                $('body').removeClass('lightbox-opened');
			    $('body').css({ overflow: 'auto' });

			    if (scope.backup) {
			        //Restoring stored elements properties
			        _.forEach(scope.backup.overflow, function (element) {
			            $(element).css('overflow', '')
			        })
			        _.forEach(scope.backup.zIndex, function (elementObj) {
			            elementObj.element.css('z-index', elementObj.index)
			        })
			    }
			});
		}
	}
});