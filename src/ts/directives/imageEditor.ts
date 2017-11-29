import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { ImageEditor } from '../image-editor/ImageEditor';
import { template } from '../template';
import { Mix } from "entcore-toolkit";
import { Document } from '../workspace';
import { Resize } from '../image-editor/image-tools/Resize';

export const imageEditor = ng.directive('imageEditor', () => {
    return {
        restrict: 'E',
        scope: {
            document: '=',
            onSave: '&',
            show: '=',
            inline: '@'
        },
        template: `
            <div ng-if="show && inline && ready">
                <container template="entcore/image-editor/main"></container>
            </div>
            <div ng-if="show && !inline && ready">
                <lightbox show="show" on-close="hide()">
                    <container template="entcore/image-editor/main"></container>
                </lightbox>
            </div>
        `,
        link: (scope, element, attributes) => {
            if(attributes.inline !== undefined){
                attributes.inline = true;
            }
            scope.template = template;
            template.open('entcore/image-editor/main');

            const imageEditor = new ImageEditor();

            const start = async () => {
                scope.ready = true;
                await ImageEditor.init();
                imageEditor.draw(element.find('section').last());
                await imageEditor.drawDocument(scope.document);
                imageEditor.imageView.eventer.on('image-loaded', () => scope.$apply());
                scope.openTool('Rotate');
                scope.$apply();
            };

            scope.scale = () => imageEditor.tool ? Math.ceil(1 / (imageEditor.tool as Resize).scale * 10) / 10 : 1;

            scope.setWidth = () => {
                if(imageEditor.tool instanceof Resize){
                    imageEditor.tool.setWidth(scope.document.width);
                }
            }

            scope.setHeight = () => {
                if(imageEditor.tool instanceof Resize){
                    imageEditor.tool.setHeight(scope.document.height);
                }
            }

            scope.openTool = async (name: string) => {
                template.open('entcore/image-editor/tool', 'entcore/image-editor/' + name.toLowerCase());
                element.find('.output, .tools-background').show();
                await imageEditor.useTool(name);
                scope.$apply();
            };

            scope.openProperties = async () => {
                imageEditor.tool = undefined;
                template.open('entcore/image-editor/tool', 'entcore/image-editor/properties');
                element.find('.output, .tools-background').hide();
                scope.$apply();
            };

            scope.apply = async () => {
                await imageEditor.applyChanges();
                scope.$apply();
            };
            scope.restoreOriginal = async () => {
                await imageEditor.restoreOriginal();
                scope.$apply();
            };

            scope.hasHistory = () => imageEditor.hasHistory;
            scope.canApply = () => imageEditor.canApply;
            scope.hasFuture = () => imageEditor.hasFuture;
            scope.undo = () => imageEditor.undo();
            scope.redo = () => imageEditor.imageView.redo();
            scope.cancel = async () => {
                await imageEditor.cancel(true);
                scope.$apply();
            }
            scope.save = async () => {
                scope.loading = true;
                if(imageEditor.canApply){
                    await imageEditor.applyChanges();
                }
                
                await imageEditor.saveChanges();
                if(typeof scope.onSave === 'function'){
                    scope.onSave();
                }
                scope.show = false;
                scope.$apply();
            };

            scope.hide = () => {
                scope.document.resetNewProperties();
                scope.show = false;
                if(!scope.$$phase){
					scope.$parent.$apply();
				}
            }

            scope.$watch(() => scope.show, () => {
                if(scope.show){
                    start();
                }
            });
        }
    }
})