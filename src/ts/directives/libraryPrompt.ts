import { ng } from '../ng-start';
import { http } from '../http';

export let libraryPrompt = ng.directive('libraryPrompt', ['$timeout', function ($timeout) {
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
                        <i18n>library.prompt.title</i18n>
                    </h1>
                    <hr>
                    <div class="apps">
                        <div class="container">
                            <i class="workspace-large"></i>
                        </div>
                        <p>
                            <i18n>library.prompt.content</i18n>
                        </p>
                    </div>
                </div>
                <hr>
                <div class="row">        
                    <button ng-click="seeLater()" class="cancel"><i18n>library.prompt.see.later</i18n></button>
                </div>
            </div>
        
        </lightbox>    
        `,
        link: function(scope, element, attributes){

            scope.show = { libraryprompt: false };

            if (!scope.originModule) {
                return;
            }

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
                scope.show.libraryprompt = true;

                scope.$apply();
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
