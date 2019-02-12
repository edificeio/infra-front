import { ng, _, idiom } from '../entcore';
import { model } from '../modelDefinitions';
import http from 'axios';

export const smartBanner = ng.directive('smartBanner', () => {
    return {
        restrict: 'E',
        template: `
        <div ng-if="showBanner"  class="smartbanner">
            <style>
                .smartbanner {
                    left:0;
                    bottom:0;
                    width:100%;
                    height:78px;
                    background:#fff;
                    z-index: 1000000;
                    overflow:hidden;
                    position: fixed;
                    border: 1px solid #ccc;
                    margin-bottom: 5px;
                }
                .smartbanner-close {
                    position:absolute;
                    left:7px;top:7px;
                    display:block;
                    font-family:'ArialRoundedMTBold',Arial;
                    font-size:15px;
                    text-align:center;
                    text-decoration:none;
                    border-radius:14px;
                    border:0;
                    width:17px;
                    height:17px;
                    line-height:17px;
                    color:#b1b1b3;
                    background:#efefef;
                }
                .smartbanner-close:active,.smartbanner-close:hover {
                    color:#333;
                }
                .smartbanner-icon{
                    position:absolute;
                    left:30px;
                    top:10px;
                    display:block;
                    width:60px;
                    height:60px;
                    background-color: #fff;
                    background-size:cover;
                }
                .smartbanner-info{
                    position:absolute;
                    left:98px;
                    top:15px;
                    width:44%;
                    font-size:12px;
                    line-height:1.2em;
                    font-weight:bold;
                    color:#999;
                }
                .smartbanner-title {
                    font-size:15px;
                    line-height:17px;
                    color:#000;
                    font-weight:bold;
                }
                .smartbanner-button{
                    position:absolute;
                    right:20px;
                    top:24px;
                    padding:0 10px;
                    min-width:12%;
                    height:24px;
                    font-size:14px;
                    line-height:24px;
                    text-align:center;
                    font-weight:bold;
                    color:#fff;
                    background-color:#b3c833;
                    text-decoration:none;
                    border-radius:5px;
                }
        
            </style>
            <div class="smartbanner-container">
                <a ng-click="closeBanner()" class="smartbanner-close">&times;</a>
                <img class="smartbanner-icon" ng-src="[[banner.icon]]">
                <div class="smartbanner-info">
                    <div class="smartbanner-title">[[banner.name]]</div>
                    <div>[[banner.description]]</div>
                </div>
                <a href="[[appRef]]" target="_blank" class="smartbanner-button">
                    <span class="smartbanner-button-text"><i18n>View</i18n></span>
                </a>
            </div>
        </div>
        `,

        scope: {},

        link: (scope, element, attributes) => {


            scope.closeBanner = function () {
                scope.setCookie("test",30);
                scope.showBanner = false;
            }

            scope.getCookie = function () {
                var name = "smartBanner" + "=";
                var decodedCookie = decodeURIComponent(document.cookie);
                var ca = decodedCookie.split(';');
                for(var i = 0; i <ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return null;
            }

            scope.setCookie = function(cvalue, exdays) {
                var d = new Date();
                d.setTime(d.getTime() + (exdays*24*60*60*1000));
                var expires = "expires="+ d.toUTCString();
                document.cookie = "smartBanner=" + cvalue + ";" + expires;
            }
            scope.showBanner = false

            scope.init = async function () {
                scope.banner = await http.get('/conf/smartBanner');
                if(model.me.hasApp && model.me.type != "ELEVE" && scope.banner != null) {
                    scope.banner = scope.banner.data
                    scope.showBanner = scope.getCookie() == null;
                    if (scope.showBanner) {
                        if (/Android/i.test(navigator.userAgent)) {
                            scope.store = "Google Play"
                            scope.appRef = scope.banner.android
                        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                            scope.store = "App Store"
                            scope.appRef = scope.banner.ios;
                        } else {
                            scope.showBanner = false;
                        }
                    }
                }
            }

            scope.init();

        }
    };
});