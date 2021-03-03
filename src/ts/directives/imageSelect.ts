import { ng } from '../ng-start';
import { MediaLibrary, Document } from '../workspace';
import { $ } from "../libs/jquery/jquery";
import { notify } from '../notify';

export let imageSelect = ng.directive('imageSelect', function(){
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			ngModel: '=',
			thumbnails: '&',
			ngChange: '&',
			default: '@'
		},
		template: '<div><img ng-src="[[ngModel + \'?\' + getThumbnails()]]" class="pick-file" draggable="false" ng-if="ngModel" style="cursor: pointer" />' +
			'<i class="trash" ng-click="restoreDefault()"></i>' +
			'<i class="edit pick-file"></i>' +
			'<img skin-src="[[default]]" class="pick-file" draggable="false" ng-if="!ngModel" style="cursor: pointer" />' +
			'<lightbox show="userSelecting">' +
			'<div ng-if="userSelecting">' +
			'<media-library ' +
				'visibility="selectedFile.visibility"' +
				'ng-change="updateDocument()" ' +
				'ng-model="selectedFile.file" ' +
				'file-format="\'img\'">' +
			'</media-library>' +
			'</div>' +
			'</lightbox>' +
			'</div>',
		link: function(scope, element, attributes){
			scope.selectedFile = { file: {}, visibility: 'protected' };

			scope.selectedFile.visibility = scope.$parent.$eval(attributes.visibility);
			if(!scope.selectedFile.visibility){
				scope.selectedFile.visibility = 'protected';
			}
			scope.selectedFile.visibility = scope.selectedFile.visibility.toLowerCase();

			scope.restoreDefault = () => {
				setTimeout(() => {
					scope.ngModel = '';
					scope.ngChange();
				}, 10);
			};

			element.on('dragenter', (e) => {
				e.preventDefault();
			});

			element.on('dragstart', 'img', (e) => {
				e.preventDefault();
			})

			element.on('dragover', (e) => {
				element.addClass('droptarget');
				e.preventDefault();
			});

			element.on('dragleave', () => {
				element.removeClass('droptarget');
			});

			element.on('drop', async (e) => {
				if(element.find($(e.target).parents('lightbox').first()).length > 0){
					return;
				}
				e.preventDefault();

				const file = e.originalEvent.dataTransfer.files[0];
				if(file.type.indexOf('image') === -1 || e.originalEvent.dataTransfer.files.length > 1){
					notify.error('medialibrary.unsupported');
					return;
				}

				element.removeClass('droptarget');
				element.addClass('loading-panel');
				
				const doc = new Document();
				await doc.upload(file, scope.selectedFile.visibility);
				scope.selectedFile.file = doc;
				scope.updateDocument();
				element.removeClass('loading-panel');
				MediaLibrary.appDocuments.sync();
			});

			scope.$watch('thumbnails', (thumbs) => {
				var evaledThumbs = scope.$eval(thumbs);
				if(!evaledThumbs){
					return;
				}
				scope.getThumbnails = () => {
					var link = '';
					evaledThumbs.forEach((th) =>{
						link += 'thumbnail=' + th.width + 'x' + th.height + '&';
					});
					return link;
				}
			});

			scope.updateDocument = () => {
//				setTimeout(() => {
					scope.userSelecting = false;
					var path = '/workspace/document/';
					if(scope.selectedFile.visibility === 'public'){
						path = '/workspace/pub/document/'
					}
					scope.ngModel = path + scope.selectedFile.file._id;
					scope.ngChange();
//				}, 10);
			};
			element.on('click', '.pick-file', () => {
				scope.userSelecting = true;
			});
		}
	}
});