"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment_1 = require("./libs/moment/moment");
var idiom_1 = require("./idiom");
var http_1 = require("./http");
var notify_1 = require("./notify");
exports.recorder = (function () {
    //vendor prefixes
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context, ws = null, intervalId, gainNode, recorder, player = new Audio();
    var leftChannel = [], rightChannel = [];
    var bufferSize = 16384, loaded = false, recordingLength = 0, lastIndex = 0, encoder = new Worker('/infra/public/js/audioEncoder.js'), followers = [];
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    function sendWavChunk() {
        var index = rightChannel.length;
        if (!(index > lastIndex))
            return;
        encoder.postMessage(['chunk', leftChannel.slice(lastIndex, index), rightChannel.slice(lastIndex, index), (index - lastIndex) * bufferSize]);
        encoder.onmessage = function (e) {
            var deflate = new Zlib.Deflate(e.data);
            ws.send(deflate.compress());
        };
        lastIndex = index;
    }
    function closeWs() {
        if (ws) {
            if (ws.readyState === 1) {
                ws.close();
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
    function notifyFollowers(status, data) {
        followers.forEach(function (follower) {
            if (typeof follower === 'function') {
                follower(status, data);
            }
        });
    }
    return {
        elapsedTime: 0,
        loadComponents: function () {
            this.title = idiom_1.idiom.translate('recorder.filename') + moment_1.moment().format('DD/MM/YYYY');
            loaded = true;
            navigator.getUserMedia({
                audio: true
            }, function (mediaStream) {
                context = new AudioContext();
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
            }.bind(this), function (err) {
            });
        },
        isCompatible: function () {
            return navigator.getUserMedia !== undefined && window.AudioContext !== undefined;
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
        record: function () {
            player.pause();
            var that = this;
            if (ws) {
                that.status = 'recording';
                notifyFollowers(that.status);
                if (!loaded) {
                    that.loadComponents();
                }
            }
            else {
                ws = new WebSocket((window.location.protocol === "https:" ? "wss" : "ws") + "://" +
                    window.location.host + "/audio/" + uuid());
                ws.onopen = function () {
                    if (player.currentTime > 0) {
                        player.currentTime = 0;
                    }
                    that.status = 'recording';
                    notifyFollowers(that.status);
                    if (!loaded) {
                        http_1.http().get('/infra/public/js/zlib.min.js').done(function () {
                            that.loadComponents();
                        }.bind(this));
                    }
                };
                ws.onerror = function (event) {
                    console.log(event);
                    that.status = 'stop';
                    notifyFollowers(that.status);
                    closeWs();
                    notify_1.notify.info(event.error);
                };
                ws.onmessage = function (event) {
                    if (event.data && event.data.indexOf("error") !== -1) {
                        console.log(event.data);
                        closeWs();
                        notify_1.notify.info(event.data);
                    }
                    else if (event.data && event.data === "ok") {
                        closeWs();
                        notify_1.notify.info("recorder.saved");
                        notifyFollowers('saved');
                    }
                };
                ws.onclose = function (event) {
                    that.status = 'stop';
                    notifyFollowers(that.status);
                    clearWs();
                };
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
    };
}());
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.recorder = exports.recorder;
//# sourceMappingURL=recorder.js.map