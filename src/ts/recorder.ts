import { moment } from './libs/moment/moment';
import { idiom as lang } from './idiom';
import { http, httpPromisy } from './http';
import { notify } from './notify';
declare const Zlib: any;

let _zlib = null;
async function getZlib() {
	if (!_zlib) {
		_zlib = await httpPromisy().get('/infra/public/js/zlib.min.js');
	}
	return _zlib;
}

console.log("Use new recorder module");

const resolvedNavigatorModules = {
	getUserMediaLegacy: navigator.getUserMedia
		|| (navigator as any).webkitGetUserMedia
		|| (navigator as any).mozGetUserMedia
		|| (navigator as any).msGetUserMedia,
	getUserMedia: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
	AudioContext: (window as any).AudioContext || (window as any).webkitAudioContext,
}

export var recorder = (function () {

	console.log("BIDULE");

	var context,
		ws = null,
		intervalId,
		gainNode,
		recorder,
		compress = true,
		player = new Audio();
	var leftChannel = [],
		rightChannel = [];

	var bufferSize = 4096,
		loaded = false,
		recordingLength = 0,
		lastIndex = 0,
		encoder = new Worker('/infra/public/js/audioEncoder.js'),
		followers = [];

	function uuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	function getUrl(sampleRate: number) {
		const protocol = window.location.protocol === "https:" ? "wss" : "ws";
		const base = protocol + "://" + window.location.host
		return `${base}/audio/${uuid()}?sampleRate=${sampleRate}`;
	}

	function sendWavChunk() {
		var index = rightChannel.length;
		if (!(index > lastIndex)) return;
		encoder.postMessage(['chunk', leftChannel.slice(lastIndex, index), rightChannel.slice(lastIndex, index), (index - lastIndex) * bufferSize]);
		encoder.onmessage = function (e) {
			if (!compress) {
				ws.send(e.data);
				return;
			}
			const initialTime = parseInt(performance.now());
			var deflate = new Zlib.Deflate(e.data);
			ws.send(deflate.compress());
			const endTime = parseInt(performance.now());
			if (endTime - initialTime > 50) {
				compress = false;
				ws.send('rawdata');
			}
		};
		lastIndex = index;
	}

	function closeWs() {
		if (ws) {
			if (ws.readyState === 1) {
				ws.close()
			}
		}
		clearWs();
	}

	function clearWs() {
		ws = null;
		leftChannel = [];
		rightChannel = [];
		lastIndex = 0;
	}

	function notifyFollowers(status, data?) {
		followers.forEach(function (follower) {
			if (typeof follower === 'function') {
				follower(status, data);
			}
		})
	}

	return {
		elapsedTime: 0,
		loadComponents: function () {
			this.title = lang.translate('recorder.filename') + moment().format('DD/MM/YYYY');
			loaded = true;

			console.log("RECORDER");

			const handleMediaStream = mediaStream => {
				console.log("handleMediaStream");
				context = new (resolvedNavigatorModules.AudioContext)();
				encoder.postMessage(["init", context.sampleRate])
				var audioInput = context.createMediaStreamSource(mediaStream);
				gainNode = context.createGain();
				audioInput.connect(gainNode);

				recorder = context.createScriptProcessor(bufferSize, 2, 2);
				recorder.onaudioprocess = function (e) {
					if (this.status !== 'recording') {
						return;
					}
					var left = new Float32Array(e.inputBuffer.getChannelData(0));
					leftChannel.push(left);
					var right = new Float32Array(e.inputBuffer.getChannelData(1));
					rightChannel.push(right);

					recordingLength += bufferSize;

					this.elapsedTime += e.inputBuffer.duration;

					sendWavChunk();

					notifyFollowers(this.status);
				}.bind(this);

				gainNode.connect(recorder);
				recorder.connect(context.destination);
			}

			console.log("resolved :", resolvedNavigatorModules);

			if (resolvedNavigatorModules.getUserMedia !== undefined) {
				console.log("getUserMedia");
				resolvedNavigatorModules.getUserMedia.call(navigator.mediaDevices, { audio: true })
					.then(handleMediaStream)
					.catch(err => { console.log("err:", err) })
			} else if (resolvedNavigatorModules.getUserMediaLegacy !== undefined) {
				console.log("getUserMediaLegacy");
				// Legacy. Prevent crash in that motherfu**ing IE 💩
				resolvedNavigatorModules.getUserMediaLegacy({ audio: true },
					handleMediaStream,
					function (err) { console.log("err:", err) }
				)
			}

		},
		isCompatible: function () {
			console.log("isCompatible ?");
			return resolvedNavigatorModules.AudioContext !== undefined
				&& (resolvedNavigatorModules.getUserMedia !== undefined
					|| resolvedNavigatorModules.getUserMediaLegacy !== undefined
				)
		},
		stop: function () {
			if (ws) {
				ws.send("cancel");
			}
			this.status = 'idle';
			player.pause();
			if (player.currentTime > 0) {
				player.currentTime = 0;
			}
			leftChannel = [];
			rightChannel = [];
			notifyFollowers(this.status);
		},
		flush: function () {
			this.stop();
			this.elapsedTime = 0;
			leftChannel = [];
			rightChannel = [];
			notifyFollowers(this.status);
		},
		record: async function () {
			console.log("record");
			player.pause();
			var that = this;
			if (that.status == 'preparing') return;
			that.status = 'preparing';
			await getZlib();
			if (ws) {
				that.status = 'recording';
				notifyFollowers(that.status);
				if (!loaded) {
					that.loadComponents();
				}
			} else {
				console.log("creating ws", resolvedNavigatorModules);
				ws = new WebSocket(getUrl(new (resolvedNavigatorModules.AudioContext)().sampleRate));
				ws.onopen = function () {
					console.log("ws created");
					if (player.currentTime > 0) {
						player.currentTime = 0;
					}

					that.status = 'recording';
					notifyFollowers(that.status);
					if (!compress) {
						ws.send('rawdata');
					}
					if (!loaded) {
						that.loadComponents();
					}
				};
				ws.onerror = function (event: ErrorEvent) {
					console.log(event);
					that.status = 'stop';
					notifyFollowers(that.status);
					closeWs();
					notify.error(event.error);
				}
				ws.onmessage = (event) => {
					if (event.data && event.data.indexOf("error") !== -1) {
						console.log(event.data);
						closeWs();
						notify.error(event.data);
					} else if (event.data && event.data === "ok" && this.status === "encoding") {
						closeWs();
						notify.info("recorder.saved");
						notifyFollowers('saved');
						this.elapsedTime = 0;
					}

				}
				ws.onclose = function (event) {
					that.status = 'stop';
					notifyFollowers(that.status);
					clearWs();
				}
			}
		},
		pause: function () {
			this.status = 'paused';
			player.pause();
			notifyFollowers(this.status);
		},
		play: function () {
			this.pause();
			this.status = 'playing';
			var encoder = new Worker('/infra/public/js/audioEncoder.js');
			encoder.postMessage(['wav', rightChannel, leftChannel, recordingLength]);
			encoder.onmessage = function (e) {
				player.src = window.URL.createObjectURL(e.data);
				player.play();
			};
			notifyFollowers(this.status);
		},
		state: function (callback) {
			followers.push(callback);
		},
		title: "",
		status: 'idle',
		save: function () {
			sendWavChunk();
			ws.send("save-" + this.title);
			this.status = 'encoding';
			notifyFollowers(this.status);
		},
		mute: function (mute) {
			if (mute) {
				gainNode.gain.value = 0;
			}
			else {
				gainNode.gain.value = 1;
			}
		}
	}
}());

if (!(window as any).entcore) {
	(window as any).entcore = {};
}
(window as any).entcore.recorder = recorder;