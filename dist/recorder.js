"use strict";
var idiom_1 = require('./idiom');
var http_1 = require('./http');
var ng_app_1 = require('./ng-app');
var moment = require('moment');
exports.recorder = (function () {
    //vendor prefixes
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context, gainNode, recorder, player = new Audio();
    var leftChannel = [], rightChannel = [];
    var bufferSize = 4096, loaded = false, recordingLength = 0, followers = [];
    function notifyFollowers(status, data) {
        if (data === void 0) { data = undefined; }
        followers.forEach(function (follower) {
            if (typeof follower === 'function') {
                follower(status, data);
            }
        });
    }
    return {
        protected: false,
        elapsedTime: 0,
        loadComponents: function () {
            this.title = idiom_1.idiom.translate('recorder.filename') + moment().format('DD/MM/YYYY');
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
                    if (this.status !== 'recording' && this.status !== 'paused' && this.status !== 'playing') {
                        mediaStream.stop();
                        loaded = false;
                    }
                    if (this.status !== 'recording') {
                        return;
                    }
                    var left = e.inputBuffer.getChannelData(0);
                    leftChannel.push(new Float32Array(left));
                    var right = e.inputBuffer.getChannelData(1);
                    rightChannel.push(new Float32Array(right));
                    recordingLength += bufferSize;
                    this.elapsedTime += e.inputBuffer.duration;
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
            this.status = 'idle';
            player.pause();
            if (player.currentTime > 0) {
                player.currentTime = 0;
            }
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
            if (player.currentTime > 0) {
                player.currentTime = 0;
            }
            this.status = 'recording';
            notifyFollowers(this.status);
            if (!loaded) {
                this.loadComponents();
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
        save: function (callback, format) {
            this.stop();
            this.status = 'encoding';
            notifyFollowers(this.status);
            if (!format) {
                format = 'mp3';
            }
            var form = new FormData();
            var encoder = new Worker('/infra/public/js/audioEncoder.js');
            encoder.postMessage([format, rightChannel, leftChannel, recordingLength]);
            encoder.onmessage = function (e) {
                this.status = 'uploading';
                notifyFollowers(this.status);
                form.append('blob', e.data, this.title + '.' + format);
                var url = '/workspace/document';
                if (this.protected) {
                    url += '?application=mediaLibrary&protected=true';
                }
                http_1.http().postFile(url, form).done(function (doc) {
                    if (typeof callback === 'function') {
                        callback(doc);
                        this.flush();
                        ng_app_1.notify.info('recorder.saved');
                    }
                }.bind(this));
            }.bind(this);
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
