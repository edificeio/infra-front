import { appPrefix, devices, deviceType } from "../globals";
import { http } from "../http";
import { ng } from "../ng-start";

export const VideoEventTracker = ng.service("VideoEventTracker", [
(function(){

	function VideoEventTracker() {
		this.videos = [];
	}

	function generateEvent( type: "play"|"view", videoId: string) {
		var browserInfo = devices.getBrowserInfo();
		var videoEventData = {
			videoId: videoId,
			device: deviceType,
			browser: browserInfo.name + ' ' + browserInfo.version,
			session: '',	// TODO: in the end, this is intended to identify a session of play/pause/...
			source: 'CAPTURED',
			duration: 0,	// This will become the "duration of the play session"
			url: window.location.hostname,
			app: appPrefix
		}
		http().postJson('/video/event/'+type, videoEventData).done(function(res){
			console.log(res);
		});
	}

	VideoEventTracker.prototype.onPlay  = function(event:Event) {
		var videoId = (event.target as HTMLVideoElement).dataset.documentId || '';
		generateEvent( "play", videoId );
	}

	VideoEventTracker.prototype.generateViewEventFor = function( video: HTMLVideoElement) {
		var videoId = video.dataset.documentId || '';
		generateEvent( "view", videoId );
	}

	VideoEventTracker.prototype.trackAll = function( $scope ) {
		const videos = document.querySelectorAll('video');
		// For each video players in the document.
		for( var i=0; videos && i<videos.length; i++ ) {
			var video: HTMLVideoElement = videos[i];
			if( ! video )
				continue;
			// Track this video player.
			video.addEventListener('play', this.onPlay);
			this.videos.push( video );
			// Forbid downloading : this is not supported by all navigators, see https://caniuse.com/?search=controlsList
			video.setAttribute("controlsList", "nodownload");
			// Generate a VIDEO_EVENT_VIEW
			this.generateViewEventFor( video );
		}
		if( $scope )
			$scope.$on('$destroy', this.untrackAll);
	}

	VideoEventTracker.prototype.untrackAll = function() {
		for( var i=0; i<this.videos.length; i++ ) {
			var video = this.videos[i];
			if( ! video )
				continue;
			video.removeEventListener('play', this.onPlay);
		}
		this.videos = [];
	}

	return VideoEventTracker;
})()
]);
