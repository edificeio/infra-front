import { ng } from '../ng-start';
import { http } from '../http';
import { idiom as lang } from '../idiom';
import { deviceType } from '../globals';

export let libraryPrompt = ng.directive('libraryPrompt', ['$timeout', '$sce', function ($timeout, $sce) {
    return {
        restrict: 'E',
        scope: {
            'originModule': '=',
        },
        template: `
        <lightbox show="show.libraryprompt" on-close="ignore()">

            <a class="ignore" ng-click="ignore()"><i18n>library.prompt.ignore</i18n></a>
            <hr>
            <div class="reduce-block-eight">
                <div class="block-container">
                    <h1 class="centered-text">
                        <i18n ng-if="step == 1">library.prompt.title1</i18n>
                        <i18n ng-if="step == 2">library.prompt.title2</i18n>
                    </h1>
                    <hr>
                    <div class="apps">
                        <div ng-if="step == 1" class="container">
                            <i class="library-large"></i>
                        </div>
                        <div>
                            <div ng-if="step == 1" class="content1" ng-bind-html="content1"></div>
                            <div ng-if="step == 2" class="content1 centered-text" ng-bind-html="content2"></div>
                            <div ng-if="step == 2">
                                <img skin-src="/img/illustrations/library-incentive.gif" />
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <nav class="dots">
                    <ul>
                        <li class="dot" ng-click="step = 1" ng-class="{ active: step == 1 }"></li>
                        <li class="dot" ng-click="step = 2" ng-class="{ active: step == 2 }"></li>
                    </ul>
                </nav>
                <div class="row">        
                    <button ng-click="seeLater()" class="cancel"><i18n>library.prompt.see.later</i18n></button>
                    <button ng-show="step == 1" ng-click="step = 2" class="right-magnet"><i18n>library.prompt.how.to.publish</i18n></button>
                    <button ng-show="step == 2" ng-click="ignore()" class="right-magnet"><i18n>library.prompt.understood</i18n></button>
                </div>
            </div>
        
        </lightbox>
        `,
        link: function(scope, element, attributes){

            scope.show = { libraryprompt: false };

            if (!scope.originModule || deviceType != 'Desktop') {
                return;
            }

            let moduleTranslated = lang.translate(scope.originModule + '.library.prompt.title');
            scope.content1 = $sce.trustAsHtml(lang.translate('library.prompt.content1').replace('[[modules]]', moduleTranslated));
            scope.content2 = $sce.trustAsHtml(lang.translate('library.prompt.content2'));
            scope.step = 1;

            let state;

            http().get('/userbook/preference/libraryprompt').done(function(pref){
                let preferences;
                if(pref.preference){
                    try{
                        preferences = JSON.parse(pref.preference);
                    }
                    catch(e){
                        console.log('Error parsing quickstart preferences');
                    }
                }
                if(!preferences){
                    preferences = {};
                }
                if(!preferences[scope.originModule]){
                    preferences[scope.originModule] = 0;
                }
                if(preferences[scope.originModule] == -1){
                    return;
                }

                state = preferences;

                setTimeout(function(){
                    scope.show.libraryprompt = true;
                    scope.$apply();
                }, 1000);
            });
            

            scope.save = function(){
                http().putJson('/userbook/preference/libraryprompt', state);
            }

            scope.ignore = function() {
                closeLightbox(-1);
            }

            scope.seeLater = function() {
                closeLightbox(0);
            }

            let closeLightbox = function(newState){
                scope.show.libraryprompt = false;
                state[scope.originModule] = newState;
                scope.save();
            };
        }
    }
}]);
