import { ng } from "../ng-start";
import { $ } from "../libs/jquery/jquery";
import { Me } from "../me";
import http from 'axios';

export const toast = ng.directive('toastOnboarding', ['$http', function($http) {
	return {
		restrict: "E",
		scope: {
			show: "="
		},
		templateUrl: "/public/template/entcore/video/onboarding.html",
		link: function(scope, element, attr){
            scope.display = {
                preference: true,
                visible: false
            }

            let key:string = "onboarding";
            async function getShowOnboardingPref() {
                await http.get(`/userbook/preference/${key}`).then(function(response){
                    let preferences;
                    if(response.data.preference){
                        try {
                            preferences = JSON.parse(response.data.preference);
                            scope.display.preference = preferences.showOnboardingVideo;
                            scope.display.visible = scope.display.preference === true ? true : false;
                        } catch(error){
                            console.log(error);
                        }
                    } else {
                        scope.display.visible = true;
                    }
                });
            }

            function saveUserPreference() {
                if (scope.display.preference) http.put(`/userbook/preference/${key}`, JSON.stringify({"showOnboardingVideo":false}));
            };

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
                if (await Me.hasWorkflowRight("video.upload")) {
                    await getShowOnboardingPref();
                    if (scope.display.visible === true) {
                        await displayOnboardingVideo();
                    }
                }
            }

            scope.hideToastAndSavePreference = function(save) {
                removeAttrBody();
                if (save === true) saveUserPreference();
            };

            scope.openEmbedder = function() {
                removeAttrBody();
                saveUserPreference();
                scope.show = true;
            }

            init();
        }
    }
}]);