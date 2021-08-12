import { ng } from '../ng-start';
import { VideoEventTrackerService } from '../video/VideoEventTrackerService';

/** Track video VIEW and READ events for every <video data-document-is-captation=""> */
export let documentIsCaptation = ng.directive('documentIsCaptation', ['VideoEventTracker', (videoEventTracker:VideoEventTrackerService) => {
    return {
        restrict: 'A',
        link: (scope, element /*jQuery*/, attributes) => {
            if( !element || element.length<1 ) 
                return;
            const domElement = element.get(0);
            if( domElement && HTMLVideoElement.prototype.isPrototypeOf(domElement) ) {
                videoEventTracker.trackOne(domElement);
                scope.$on('$destroy', () => {videoEventTracker.untrackOne(domElement);});
            }
        }
    }
}]);
