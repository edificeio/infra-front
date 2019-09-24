import { ng, template, Document, $ } from '../entcore';

/**
 * @description This directive is based on the mediaLibrary import. What it does:
 * - displays a file picker and draggable zone,
 * - displays picked files list,
 * - stores picked files in files attribute
 * 
 * @param files picked files
 * @param multiple boolean, allows multiple files selection
 * 
 * @example
 * <file-picker-list 
 * 	 files="controller.files" 
 *   multiple="true">
 * </file-picker-list>
 */
export const filePickerList = ng.directive('filePickerList', () => {
    return {
        restrict: 'E',
		scope: {
			files: '=',
			multiple: '@',
			hideList: '@?'
		},
		template: `
			<div class="file-picker-list" show="display.listFiles">
				<div class="row media-library">
                    <container template="pick"></container>
				</div>
			</div>
		`,
        link: (scope, element, attributes) => {
			template.open('pick', 'entcore/file-picker-list/pick');
			
			if(!scope.display) {
				scope.display = {};
			}
			
			scope.picked = {};
			scope.filesArray = [];

			$('body').on('dragenter', '.icons-view', (e) => e.preventDefault());
			$('body').on('dragover', '.icons-view', (e) => e.preventDefault());
            element.on('dragenter', (e) => e.preventDefault());

			element.on('dragover', (e) => {
				element.find('.drop-zone').addClass('dragover');
				e.preventDefault();
			});

			element.on('dragleave', () => {
				element.find('.drop-zone').removeClass('dragover');
			});

			const dropFiles = (e) => {
				if(!e.originalEvent.dataTransfer.files.length){
					return;
				}
				element.find('.drop-zone').removeClass('dragover');
				e.preventDefault();
				scope.listFiles(e.originalEvent.dataTransfer.files);
				if (!scope.hideList) {
					scope.display.listFiles = true;
				}
				scope.$apply();
			}
			
			scope.listFiles = function(files){
				if(!files){
                    files = scope.picked.files;
				}
				scope.filesArray = Array.from(files);
				scope.files = scope.filesArray;
				if (!scope.hideList) {
					template.open('pick', 'entcore/file-picker-list/list');
				} else {
					scope.$apply();
				}
			}

			$('body').on('drop', '.icons-view', dropFiles);
			element.on('drop', dropFiles);

            scope.delete = (file: File) => {
				scope.filesArray = scope.filesArray.filter(f => f != file);
				if(scope.filesArray && scope.filesArray.length == 0){
					template.open('pick', 'entcore/file-picker-list/pick');
				}
			};

			scope.getIconClass = (contentType) => {
				return Document.role(contentType);
			}

			scope.getSizeHumanReadable = (size) => {
				const koSize = size / 1024;
				if(koSize > 1024){
					return (parseInt(koSize / 1024 * 10) / 10)  + ' Mo';
				}
				return Math.ceil(koSize) + ' Ko';
			}
        }
    }
})
