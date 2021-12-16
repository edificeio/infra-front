import { ng } from "../ng-start";
import { $ } from "../libs/jquery/jquery";
import { Me } from "../me";
import { ui } from '../ui';
import http from 'axios';

export const toast = ng.directive('toastOnboarding', ['$http', function($http) {
	return {
		restrict: "E",
		scope: {
			show: "="
		},
		templateUrl: "/public/template/entcore/video/onboarding.html",
		link: function(scope, element, attr){

            const key:string = "onboarding";
            const HAS_VIDEO_UPLOAD_RIGHT:Promise<boolean> = Me.hasWorkflowRight("video.upload");
            http.put(`/userbook/preference/${key}`, JSON.stringify({"showOnboardingVideo":true}));

            scope.display = {
                preference: true,
                visible: false
            }

            async function getShowOnboardingPref() {
                await http.get(`/userbook/preference/${key}`).then(function(response){
                    let preferences;
                    if(response.data.preference){
                        try {
                            preferences = JSON.parse(response.data.preference);
                        } catch(error){
                            console.log(error);
                        }
                    }
                    scope.display.preference = preferences.showOnboardingVideo;
                    scope.display.visible = scope.display.preference === true ? true : false;
                });
            }

            function displayOnboardingVideo() {
                $("body").addClass("highlight-video");
                    $("html, body").animate({
                        scrollTop: $("editor").offset().top,
                    }, 1000, function() {
                        $("body").css("overflow", "hidden");
                    });
                    scope.$apply();
            }

            function removeAttrBody() {
                scope.display.visible = false;
                $("body").removeAttr("style").removeClass('highlight-video');
            }

            async function init() {
                if (HAS_VIDEO_UPLOAD_RIGHT) {
                    await getShowOnboardingPref();
                    if (scope.display.visible === true) {
                        await displayOnboardingVideo();
                    }
                }
            }

            scope.saveUserPreference = function() {
                if (scope.display.preference) http.put(`/userbook/preference/${key}`, JSON.stringify({"showOnboardingVideo":false}));
            };
            scope.hideToastAndSavePreference = function(save) {
                removeAttrBody();
                if (save === true) scope.saveUserPreference();
            };
            scope.openEmbedder = function() {
                removeAttrBody();
                scope.saveUserPreference();
                scope.show = true;
            }

            init();
        }
    }
}]);