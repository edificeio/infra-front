import { ng } from '../ng-start';
import { workspace } from '../workspace';

export let imageSelect = ng.directive('imageSelect', function($compile){
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			ngModel: '=',
			thumbnails: '&',
			ngChange: '&',
			default: '@'
		},
		template: '<div><img ng-src="[[ngModel]]?[[getThumbnails()]]" class="pick-file" draggable="false" ng-if="ngModel" style="cursor: pointer" />' +
			'<img skin-src="[[default]]" class="pick-file" draggable="false" ng-if="!ngModel" style="cursor: pointer" />' +
			'<lightbox show="userSelecting" on-close="userSelecting = false;">' +
			'<media-library ' +
				'visibility="selectedFile.visibility"' +
				'ng-change="updateDocument()" ' +
				'ng-model="selectedFile.file" ' +
				'file-format="\'img\'">' +
			'</media-library>' +
			'</lightbox>' +
			'</div>',
		link: function(scope, element, attributes){
			scope.selectedFile = { file: {}, visibility: 'protected' };

			scope.selectedFile.visibility = scope.$parent.$eval(attributes.visibility);
			if(!scope.selectedFile.visibility){
				scope.selectedFile.visibility = 'protected';
			}
			scope.selectedFile.visibility = scope.selectedFile.visibility.toLowerCase();

			element.on('dragenter', function(e){
				e.preventDefault();
			});

			element.on('dragover', function(e){
				element.addClass('droptarget');
				e.preventDefault();
			});

			element.on('dragleave', function(){
				element.removeClass('droptarget');
			});

			element.on('drop', function(e){
				element.removeClass('droptarget');
				element.addClass('loading-panel');
				e.preventDefault();
				var file = e.originalEvent.dataTransfer.files[0];
				workspace.Document.prototype.upload(file, 'file-upload-' + file.name + '-0', function(doc){
					scope.selectedFile.file = doc;
					scope.updateDocument();
					element.removeClass('loading-panel');
				}, scope.selectedFile.visibility);
			});

			scope.$watch('thumbnails', function(thumbs){
				var evaledThumbs = scope.$eval(thumbs);
				if(!evaledThumbs){
					return;
				}
				scope.getThumbnails = function(){
					var link = '';
					evaledThumbs.forEach(function(th){
						link += 'thumbnail=' + th.width + 'x' + th.height + '&';
					});
					return link;
				}
			});

			scope.updateDocument = function(){
				scope.userSelecting = false;
				var path = '/workspace/document/';
				if(scope.selectedFile.visibility === 'public'){
					path = '/workspace/pub/document/'
				}
				scope.ngModel = path + scope.selectedFile.file._id;
				scope.$apply();
				scope.ngChange();
			};
			element.on('click', '.pick-file', function(){
				scope.userSelecting = true;
				scope.$apply('userSelecting');
			});
		}
	}
});