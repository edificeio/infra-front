import { ng } from '../ng-start';
import { appPrefix, infraPrefix } from '../globals';
import { http } from '../http';
import { idiom } from '../idiom';
import { _ } from '../libs/underscore/underscore';
import { Model } from '../modelDefinitions';
import { Me } from '../me';

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
                edited: []
            };
        
            $scope.addResults = function(){
                $scope.maxResults += 5;
            };
        
            var actionsConfiguration = {};
        
            http().get('/' + infraPrefix + '/public/json/sharing-rights.json').done(function(config){
                actionsConfiguration = config;
            });
        
            $scope.translate = idiom.translate;
        
            function actionToRights(item, action){
                var actions = [];
                _.where($scope.actions, { displayName: action.displayName }).forEach(function(item){
                    item.name.forEach(function(i){
                        actions.push(i);
                    });
                });
        
                return actions;
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
        
            function dropRights(callback){
                function drop(resource, type){
                    var done = 0;
                    for(var element in resource[type].checked){
                        var path = '/' + currentApp + '/share/remove/' + resource._id;
                        var data:any = {};
                        if(type === 'users'){
                            data.userId = element;
                        }
                        else{
                            data.groupId = element;
                        }
                        http().put(path, http().serialize(data));
                    }
                }
                $scope.editResources.forEach(function(resource){
                    drop(resource, 'users');
                    drop(resource, 'groups');
                });
                callback();
                $scope.varyingRights = false;
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
                $scope.sharebookmarks = [];
                $scope.varyingRights = false;
                feedData();
            });
        
            $scope.$watchCollection('resources', function(){
                $scope.actions = [];
                $scope.sharingModel.edited = [];
                $scope.search = '';
                $scope.found = [];
                $scope.sharebookmarks = [];
                $scope.varyingRights = false;
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
        
                var index = -1;
                var loopAction = function(){
                    if(++index < defaultActions.length){
                        $scope.saveRights(item, defaultActions[index], loopAction);
                    }
                }
                loopAction()
        
            };

            $scope.clearSearch = function(){
                $scope.sharingModel.groups = [];
                $scope.sharingModel.users = [];
                $scope.found = [];
                $scope.sharebookmarks = [];
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
                        $scope.findUserOrGroup();
                        $scope.$apply();
                    });
                    return;
                }
                $scope.sharingModel.groups = usersCache[startSearch].groups;
                $scope.sharingModel.users = usersCache[startSearch].users;
                $scope.found = _.union(
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

                http().get('/directory/sharebookmark/all').done(function(data) {
                    var bookmarks = _.map(data, function(bookmark) {
                        bookmark.type = 'sharebookmark';
                        return bookmark;
                    });
                    $scope.sharebookmarks = _.filter(bookmarks, function(bookmark){
                        var testName = idiom.removeAccents(bookmark.name).toLowerCase();
                        return testName.indexOf(searchTerm) !== -1;
                    });
                    $scope.$apply();
                })
            };
        
            $scope.remove = function(element){
                var data;
                if(element.login !== undefined){
                    data = {
                        userId: element.id
                    }
                }
                else{
                    data = {
                        groupId: element.id
                    }
                }
        
                $scope.sharingModel.edited = _.reject($scope.sharingModel.edited, function(item){
                    return item.id === element.id;
                });
        
                $scope.resources.forEach(function(resource){
                    var path = '/' + currentApp + '/share/remove/' + resource._id;
                    http().put(path, http().serialize(data)).done(function(){
                        $rootScope.$broadcast('share-updated', data);
                    });
                })
            }
        
            $scope.maxEdit = 3;
        
            $scope.displayMore = function(){
                var displayMoreInc = 5;
                $scope.maxEdit += displayMoreInc;
            }
        
            function applyRights(element, action, cb){
                var data;
                if(element.login !== undefined){
                    data = { userId: element.id, actions: [] }
                }
                else{
                    data = { groupId: element.id, actions: [] }
                }
                data.actions = actionToRights(element, action);
        
                var setPath = 'json';
                if(!element.actions[action.displayName]){
                    setPath = 'remove';
                    _.filter($scope.actions, function(item){
                        return _.find(item.requires, function(dependency){
                            return action.displayName.split('.')[1].indexOf(dependency) !== -1;
                        }) !== undefined
                    })
                    .forEach(function(item){
                        if(item){
                            element.actions[item.displayName] = false;
                            data.actions = data.actions.concat(actionToRights(element, item));
                        }
                    })
                }
                else{
                    action.requires.forEach(function(required){
                        var action = _.find($scope.actions, function(action){
                            return action.displayName.split('.')[1].indexOf(required) !== -1;
                        });
                        if(action){
                            element.actions[action.displayName] = true;
                            data.actions = data.actions.concat(actionToRights(element, action));
                        }
                    });
                }
        
                var times = $scope.resources.length
                var countdownAction = function(){
                    if(--times <= 0 && typeof cb === 'function'){
                        cb()
                    }
                }
        
                $scope.resources.forEach(function(resource){
                    http().put('/' + currentApp + '/share/' + setPath + '/' + resource._id, http().serialize(data)).done(function(){
                        if(setPath === 'remove'){
                            $rootScope.$broadcast('share-updated', { removed: { groupId: data.groupId, userId: data.userId, actions: rightsToActions(data.actions) } });
                        }
                        else{
                            $rootScope.$broadcast('share-updated', { added: { groupId: data.groupId, userId: data.userId, actions: rightsToActions(data.actions) } });
                        }
                        countdownAction()
                    });
                });
            }
        
            $scope.saveRights = function(element, action, cb){
                if($scope.varyingRights){
                    dropRights(function(){
                        applyRights(element, action, cb)
                    });
                }
                else{
                    applyRights(element, action, cb)
                }
            };
		}
	}
}]);
