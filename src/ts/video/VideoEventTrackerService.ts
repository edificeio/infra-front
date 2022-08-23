import { appPrefix, devices, deviceType } from "../globals";
import { http } from "../http";
import { ng } from "../ng-start";

type VideoSession = {
	elem:HTMLVideoElement;
	wasPlayed: boolean;
	cb:(this:HTMLVideoElement, ev:Event)=>any;
};

/**
 * This utility class allows sending usage data events to the server.
 */
export class VideoEventTrackerService {
	private cleanup:VideoSession[] = [];

	/**
	 * Generates a new FormData containing generic video tracking metadata : 
	 * - device,
	 * - browser,
	 * - url,
	 * - app
	 * @returns FormData
	 */
	static asFormData():FormData {
        const formData = new FormData();
        // Report useful contextual data
        const browserInfo = devices.getBrowserInfo();
        formData.append("device", deviceType);
        formData.append("browser", browserInfo.name + ' ' + browserInfo.version);
        formData.append("url", window.location.hostname);
        formData.append("app", appPrefix);
		return formData;
	}

	/** Send a VIDEO_VIEW or VIDEO_PLAY event to the server. */
	private generateEvent( type: "play"|"view", videoId: string, source:string) {
		const browserInfo = devices.getBrowserInfo();
		const videoEventData = {
			videoId: videoId,
			device: deviceType,
			browser: browserInfo.name + ' ' + browserInfo.version,
			session: '',	// TODO: in the end, this is intended to identify a session of play/pause/...
			source: source,
			duration: 0,	// This will become the "duration of the play session"
			url: window.location.hostname,
			app: appPrefix
		}
		http().postJson('/video/event/'+type, videoEventData).done(function(res){
			console.log(res);
		});
	}
	
	private onPlay(event:Event) {
		const elem = event.target as HTMLVideoElement;
		const session = this.cleanup.find( video => video.elem===elem && !video.wasPlayed );
		if( session && !session.wasPlayed ) {
			session.wasPlayed = true;

			const videoId = elem.dataset.documentId || '';
			const source = (elem.dataset.documentIsCaptation || "false") == "true" ? 'CAPTURED' : 'UPLOADED';
			this.generateEvent( "play", videoId, source );
		}
	}
	
	private generateViewEventFor( video: HTMLVideoElement) {
		const videoId = video.dataset.documentId || '';
		const source = (video.dataset.documentIsCaptation || "false") == "true" ? 'CAPTURED' : 'UPLOADED';
		this.generateEvent( "view", videoId, source );
	}
	
	/** Track VIDEO_VIEW and VIDEO_PLAY events for a given <video> element. */
	trackOne( video:HTMLVideoElement ) {
		if( ! video )
			return;
		// Track this video player.
		const onPlay = (e:Event) => {this.onPlay(e);}
		video.addEventListener('play', onPlay);
		this.cleanup.push( {elem:video, wasPlayed:false, cb:onPlay} );
		// Forbid downloading : this is not supported by all navigators, see https://caniuse.com/?search=controlsList
		video.setAttribute("controlsList", "nodownload");
		this.generateViewEventFor( video );
	}

	untrackOne( video:HTMLVideoElement ) {
		if( ! video )
			return;
		// Untrack this video player.
		for( let i=this.cleanup.length-1; i>=0; i-- ) {
			const v = this.cleanup[i];
			if( !v || v.elem!==video || !v.cb )
				continue;
			v.elem.removeEventListener('play', v.cb);
			this.cleanup.splice(i,1);
		}
	}

	/**
	 * Look for every <video data-document-is-captation> tag in the HTML document, and manage their VIDEO_VIEW and VIDEO_PLAY events.
	 * If applied to an angular scope, it will auto-release the listeners and prevent memory leaks.
	 * Otherwise, you must call untrackAll() to release the listeners.
	 * @param $scope
	 */
	trackAll( $scope ) {
		const videos = document.querySelectorAll('video[data-document-is-captation]');
		// For each video players in the document.
		for( let i=0; videos && i<videos.length; i++ ) {
			let video: HTMLVideoElement = videos[i] as HTMLVideoElement;
			this.trackOne( video );
		}
		if( $scope )
			$scope.$on('$destroy', () => {this.untrackAll();});
	}
	
	/** Release event listeners previously put on <video> tags, @see trackAll() */
	untrackAll() {
		this.cleanup.forEach( video => {
			if( video && video.elem && video.cb ) {
				video.elem.removeEventListener('play', video.cb);
			}
		});
		this.cleanup = [];
	}
}

ng.services.push( ng.service("VideoEventTrackerService", [VideoEventTrackerService]) );