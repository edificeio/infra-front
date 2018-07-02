import { ng } from '../ng-start';
import { appPrefix, infraPrefix } from '../globals';
import { http } from '../http';
import { idiom } from '../idiom';
import { _ } from '../libs/underscore/underscore';
import { Model } from '../modelDefinitions';
import { model } from '../modelDefinitions';
import { Me } from '../me';
import { notify } from '../notify';
import { template } from '../template';

export const sharePanel = ng.directive('sharePanel', ['$rootScope', ($rootScope) => {
	return {
		scope: {
			resources: '=',
			appPrefix: '='
		},
		restrict: 'E',
		templateUrl: '/' + appPrefix + '/public/template/entcore/share-panel.html',
		link: function($scope, $element, $attributes){
            var currentApp = appPrefix;
            var usersCache = {};

            // get directory workflow to manage allowSharebookmarks workflow
            async function loadDirectoryWorkflow() {
                await model.me.workflow.load(['directory']);
                $scope.$apply();
            }
            loadDirectoryWorkflow();

            if($scope.appPrefix){
                currentApp = $scope.appPrefix;
            }

            $scope.shareTable = '/' + appPrefix + '/public/template/entcore/share-panel-table.html';

            if(!($scope.resources instanceof Array) && !$scope.resources.myRights && !($scope.resources instanceof Model)){
                throw new TypeError('Resources in share panel must be instance of Array or implement Rights interface');
            }
            if(!($scope.resources instanceof Array)){
                $scope.resources = [$scope.resources];
            }
        
            $scope.sharing = {};
            $scope.found = [];
            $scope.maxResults = 5;
        
            $scope.editResources = [];
            $scope.sharingModel = {
                edited: [],
                changed: false
            };

            $scope.display = {
                showSaveSharebookmarkInput: false,
                sharebookmarkSaved: false
            }    
        
            $scope.addResults = function(){
                $scope.maxResults += 5;
            };

            $scope.showMembers = false;
        
            var actionsConfiguration = {};
        
            http().get('/' + infraPrefix + '/public/json/sharing-rights.json').done(function(config){
                actionsConfiguration = config;
            });
        
            $scope.translate = idiom.translate;
        
            function actionToRights(action){
                var rights = [];
                _.where($scope.actions, { displayName: action }).forEach(function(item){
                    item.name.forEach(function(i){
                        rights.push(i);
                    });
                });
        
                return rights;
            }
        
            function rightsToActions(rights, http?){
                var actions = {};
        
                rights.forEach(function(right){
                    var action = _.find($scope.actions, function(action){
                        return action.name.indexOf(right) !== -1
                    });
        
                    if(!action){
                        return;
                    }
        
                    if(!actions[action.displayName]){
                        actions[action.displayName] = true;
                    }
                });
        
                return actions;
            }
        
            function setActions(actions){
                $scope.actions = actions;
                $scope.actions.forEach(function(action){
                    var actionId = action.displayName.split('.')[1];
                    if(actionsConfiguration[actionId]){
                        action.priority = actionsConfiguration[actionId].priority;
                        action.requires = actionsConfiguration[actionId].requires;
                    }
                });
            }
        
            function differentRights(model1, model2){
                var result = false;
                function different(type){
                    for(var element in model1[type].checked){
                        if(!model2[type].checked[element]){
                            return true;
                        }
        
                        model1[type].checked[element].forEach(function(right){
                            result = result || model2[type].checked[element].indexOf(right) === -1
                        });
                    }
        
                    return result;
                }
        
                return different('users') || different('groups');
            }
            
            var feeding = false;
            var feedData = function(){
                if(feeding){
                    return;
                }
                feeding = true;
                var initModel = true;
                if(!$scope.resources.length){
                    feeding = false;
                }
                $scope.resources.forEach(function(resource){
                    var id = resource._id;
                    http().get('/' + currentApp + '/share/json/' + id + '?search=').done(function(data){
                        if(initModel){
                            $scope.sharingModel = data;
                            $scope.sharingModel.edited = [];
                        }
        
                        data._id = resource._id;
                        $scope.editResources.push(data);
                        var editResource = $scope.editResources[$scope.editResources.length -1];
                        if(!$scope.sharing.actions){
                            setActions(data.actions);
                        }
        
                        function addToEdit(type){
                            for(var element in editResource[type].checked){
                                var rights = editResource[type].checked[element];
        
                                var groupActions = rightsToActions(rights);
                                var elementObj = _.findWhere(editResource[type].visibles, {
                                    id: element
                                });
                                if(elementObj){
                                    elementObj.actions = groupActions;
                                    if(initModel){
                                        $scope.sharingModel.edited.push(elementObj);
                                    }
        
                                    elementObj.index = $scope.sharingModel.edited.length;
                                }
                            }
                        }
        
                        addToEdit('groups');
                        addToEdit('users');
        
                        if(!initModel){
                            if(differentRights(editResource, $scope.sharingModel) || differentRights($scope.sharingModel, editResource)){
                                $scope.varyingRights = true;
                                $scope.sharingModel.edited = [];
                            }
                        }
                        initModel = false;
        
                        $scope.$apply('sharingModel.edited');
                        feeding = false;
                    });
                })
            };
        
            $scope.$watch('resources', function(){
                $scope.actions = [];
                $scope.sharingModel.edited = [];
                $scope.search = '';
                $scope.found = [];
                $scope.varyingRights = false;
                $scope.sharingModel.changed = false;
                $scope.display.showSaveSharebookmarkInput = false;
                $scope.display.sharebookmarkSaved = false;
                $scope.maxEdit = 3;
                $scope.maxResults = 5;
                feedData();
            });
        
            $scope.$watchCollection('resources', function(){
                $scope.actions = [];
                $scope.sharingModel.edited = [];
                $scope.search = '';
                $scope.found = [];
                $scope.varyingRights = false;
                $scope.sharingModel.changed = false;
                $scope.display.showSaveSharebookmarkInput = false;
                $scope.display.sharebookmarkSaved = false;
                $scope.maxEdit = 3;
                $scope.maxResults = 5;
                feedData();
            });
        
            $scope.addEdit = function(item){
                item.actions = {};
                $scope.sharingModel.edited.push(item);
                item.index = $scope.sharingModel.edited.length;
                var addedIndex = $scope.found.indexOf(item);
                $scope.found.splice(addedIndex, 1);
        
                var defaultActions = []
                $scope.actions.forEach(function(action){
                    var actionId = action.displayName.split('.')[1];
                    if(actionsConfiguration[actionId].default){
                        item.actions[action.displayName] = true;
                        defaultActions.push(action);
                    }
                });

                if(item.type == 'sharebookmark') {
                    http().get('/directory/sharebookmark/' + item.id).done(function(data) {
                        item.users = data.users;
                        item.groups = data.groups;
                        if(item.users) {
                            item.users.forEach(user => {
                                user.type = 'sharebookmark-user';
                                user.actions = {};
                                defaultActions.forEach(defaultAction => {
                                    user.actions[defaultAction.displayName] = true;
                                });
                            });
                        }

                        if(item.groups) {
                            item.groups.forEach(group => {
                                group.type = 'sharebookmark-group';
                                group.actions = {};
                                defaultActions.forEach(defaultAction => {
                                    group.actions[defaultAction.displayName] = true;
                                });
                            });
                        }
                        $scope.$apply();
                    });
                }

                $scope.sharingModel.changed = true;
                $scope.display.showSaveSharebookmarkInput = false;
                $scope.display.sharebookmarkSaved = false
            };

            $scope.clearSearch = function(){
                $scope.sharingModel.groups = [];
                $scope.sharingModel.users = [];
                $scope.found = [];
            }
        
            $scope.findUserOrGroup = function(){
                var searchTerm = idiom.removeAccents($scope.search).toLowerCase();
                var startSearch = Me.session.functions.ADMIN_LOCAL ? searchTerm.substr(0, 3) : '';
                if(!usersCache[startSearch] && !(usersCache[startSearch] && usersCache[startSearch].loading)){
                    usersCache[startSearch] = { loading: true };
                    var id = $scope.resources[0]._id;
                    var path = '/' + currentApp + '/share/json/' + id + '?search=' + startSearch;
                    if(!startSearch){
                        path = '/' + currentApp + '/share/json/' + id;
                    }
                    http().get(path).done(function(data){
                        usersCache[startSearch] = { groups: data.groups, users: data.users };
                        $scope.sharingModel.groups = usersCache[startSearch].groups;
                        $scope.sharingModel.users = usersCache[startSearch].users;

                        if(model.me.workflow.directory.allowSharebookmarks == true) {
                            http().get('/directory/sharebookmark/all').done(function(data) {
                                var bookmarks = _.map(data, function(bookmark) {
                                    bookmark.type = 'sharebookmark';
                                    return bookmark;
                                });
                                usersCache[startSearch]['sharebookmarks'] = bookmarks;
    
                                $scope.findUserOrGroup();
                                $scope.$apply();
                            });
                        }
                        $scope.$apply();
                    });
                    return;
                }
                $scope.sharingModel.groups = usersCache[startSearch].groups;
                $scope.sharingModel.users = usersCache[startSearch].users;
                $scope.sharingModel.sharebookmarks = usersCache[startSearch].sharebookmarks;

                $scope.found = _.union(
                    _.filter($scope.sharingModel.sharebookmarks, function(bookmark){
                        var testName = idiom.removeAccents(bookmark.name).toLowerCase();
                        return testName.indexOf(searchTerm) !== -1 && $scope.sharingModel.edited.find(i => i.id === bookmark.id) === undefined;
                    }),
                    _.filter($scope.sharingModel.groups.visibles, function(group){
                        var testName = idiom.removeAccents(group.name).toLowerCase();
                        return testName.indexOf(searchTerm) !== -1 && $scope.sharingModel.edited.find(i => i.id === group.id) === undefined;
                    }),
                    _.filter($scope.sharingModel.users.visibles, function(user){
                        var testName = idiom.removeAccents(user.lastName + ' ' + user.firstName).toLowerCase();
                        var testNameReversed = idiom.removeAccents(user.firstName + ' ' + user.lastName).toLowerCase();
                        var testUsername = idiom.removeAccents(user.username).toLowerCase();
                        return (testName.indexOf(searchTerm) !== -1 || testNameReversed.indexOf(searchTerm) !== -1) || testUsername.indexOf(searchTerm) !== -1 && $scope.sharingModel.edited.find(i => i.id === user.id) === undefined;
                    })
                );
                $scope.found = _.filter($scope.found, function(element){
                    return $scope.sharingModel.edited.findIndex(i => i.id === element.id) === -1;
                })

                $scope.$apply();
            };
        
            $scope.remove = function(element){
                $scope.sharingModel.edited = _.reject($scope.sharingModel.edited, function(item){
                    return item.id === element.id;
                });
                $scope.sharingModel.changed = true;
                $scope.display.showSaveSharebookmarkInput = false;
                $scope.display.sharebookmarkSaved = false
            }
        
            $scope.maxEdit = 3;
        
            $scope.displayMore = function(){
                var displayMoreInc = 5;
                $scope.maxEdit += displayMoreInc;
            }

            $scope.changeAction = function(item, action) {
                function requiredActions(item, action) {
                    if(!item.actions[action.displayName]){
                        _.filter($scope.actions, function(i){
                            return _.find(i.requires, function(dependency){
                                return action.displayName.split('.')[1].indexOf(dependency) !== -1;
                            }) !== undefined
                        })
                        .forEach(function(i){
                            if(i){
                                item.actions[i.displayName] = false;
                            }
                        })
                    } else{
                        action.requires.forEach(function(required){
                            var action = _.find($scope.actions, function(action){
                                return action.displayName.split('.')[1].indexOf(required) !== -1;
                            });
                            if(action){
                                item.actions[action.displayName] = true;
                            }
                        });
                    }
                }

                if(item.type == 'sharebookmark') {
                    item.users.forEach(user => {
                        user.actions[action.displayName] = item.actions[action.displayName];
                        requiredActions(user, action);
                    });

                    item.groups.forEach(group => {
                        group.actions[action.displayName] = item.actions[action.displayName];
                        requiredActions(group, action);
                    });
                }

                if(item.type == 'sharebookmark-user' || item.type == 'sharebookmark-group') {
                    var element = $scope.sharingModel.edited.find(edited => edited.id == item.id);
                    if(element) {
                        element.actions = item.actions;
                        element.hide = true;
                    } else {
                        item.hide = true;
                        $scope.sharingModel.edited.push(item);
                    }
                }

                requiredActions(item, action);
                
                $scope.sharingModel.changed = true;
            }

            $scope.share = function() {
                var data: any = {};
                var users: any = {};
                var groups: any = {};
                var sharebookmarks: any = {};

                $scope.sharingModel.edited.forEach(function(item) {
                    var rights = [];
                    for(var action in item.actions) {
                        if(item.actions.hasOwnProperty(action) 
                            && item.actions[action] == true) {
                            rights = rights.concat(actionToRights(action));
                        }
                    }

                    if (item.type == 'sharebookmark') {
                        sharebookmarks[item.id] = rights;
                    } else if (item.login !== undefined || item.type == 'sharebookmark-user') {
                        users[item.id] = rights;
                    } else {
                        groups[item.id] = rights;
                    }
                });

                data['users'] = users;
                data['groups'] = groups;
                data['bookmarks'] = sharebookmarks;
                
                $scope.resources.forEach(function(resource) {
                    http().put('/' + currentApp + '/share/resource/' + resource._id, JSON.stringify(data))
                        .done(function(res){
                            notify.success('share.notify.success');
                            $rootScope.$broadcast('share-updated', res['notify-timeline-array']);
                            // template.close('lightboxes');
                        });
                });
            }

            $scope.createSharebookmark = function(newSharebookmarkName) {
                if(model.me.workflow.directory.allowSharebookmarks == true) {
                    let members = [];
                    $scope.sharingModel.edited.forEach(item => {
                        // if item is a user or a group
                        if(item.name || item.login) {
                            members.push(item.id);
                        }
                    })
                    let data = {
                        "name": newSharebookmarkName, 
                        "members": members
                    };
                    
                    http().post('/directory/sharebookmark', JSON.stringify(data)).done(res => {
                        $scope.display.sharebookmarkSaved = true;
                        $scope.$apply();
                    });
                }
            }
		}
	}
}]);
