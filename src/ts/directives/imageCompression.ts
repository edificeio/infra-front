import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { Document } from '../workspace';

const canvasWidth = 468;
const canvasHeight = 350;

export let imageCompression = ng.directive('imageCompression', () => {
    return {
        restrict: 'E',
        templateUrl: '/' + appPrefix + '/public/template/entcore/compression.html',
        scope: {
            document: '='
        },
        link: (scope, element, attributes) => {
            const hiddenCanvas = document.createElement('canvas');
            const canvas = element.find('canvas')[0];
            canvas.height = canvasHeight;
            canvas.width = canvasWidth;
            scope.result = {
                quality: 1
            };
            let blob;
            const ctx:CanvasRenderingContext2D = element.find('canvas')[0].getContext("2d");
            const hiddenCtx:CanvasRenderingContext2D = hiddenCanvas.getContext("2d");
            const sourceImage = new Image();
            const exportImage = new Image();
            const image = new Image();

            const updateCanvas = (image) => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let top = 0;
                let left = 0;
                let width = image.width;
                let ratio = 1;
                if(image.width > canvasWidth){
                    width = canvasWidth;
                    ratio =  width / image.width;
                }

                top = (canvasHeight / 2) - ((image.height / 2) * ratio);
                if(image.width < canvasWidth){
                    left = canvasWidth / 2 - (image.width / 2) * ratio;
                }
                ctx.drawImage(image, left, top, width, width * image.height / image.width);
            }

            const compress = (quality: number) => {
                if(!sourceImage.naturalWidth){
                    return;
                }
                updateCanvas(sourceImage);
                canvas.toBlob((b) => {
                    console.log(canvas.width)
                    blob = b;
                    const imageUrl = URL.createObjectURL(blob);
                    image.src = imageUrl;
                    image.onload = () => updateCanvas(image);
                }, 'image/jpeg', scope.document.currentQuality);

                hiddenCanvas.width = sourceImage.width;
                hiddenCanvas.height = sourceImage.height;
                hiddenCtx.drawImage(sourceImage, 0, 0);
                hiddenCanvas.toBlob((b) => {
                    //ignore original case with no changes
                    if(!(!scope.document.hiddenBlob && scope.document.currentQuality === 0.7)){
                        scope.document.hiddenBlob = b;
                    }
                    
                    scope.$apply();
                }, 'image/jpeg', scope.document.currentQuality);
            }

            const updateImage = () => {
                if(!scope.document.currentQuality){
                    scope.document.currentQuality = 0.7;
                }
                sourceImage.src = '/workspace/document/' + scope.document._id + '?v=' + parseInt(Math.random() * 100);
                sourceImage.onload = () => {
                    updateCanvas(sourceImage);
                    compress(scope.document.currentQuality);
                }
            }

            if(scope.document){
                updateImage();
            }

            let unit = 'Ko';
            scope.blobSize = () => {
                if(!scope.document.hiddenBlob){
                    return 0;
                }
                unit = 'Ko';
                const ko = scope.document.hiddenBlob.size / 1000;
                const mo = ko / 1000;
                if(mo >= 1){
                    unit = 'Mo';
                    return Math.round(mo * 10) / 10;
                }
                return Math.round(ko);
            }

            scope.blobUnit = () => {
                return unit;
            }

            scope.$watch(() => scope.document.currentQuality, () => compress(scope.document.currentQuality));
            scope.$watch('document', () => updateImage());
            scope.document.eventer.on('save', () => updateImage());
        }
    }
});