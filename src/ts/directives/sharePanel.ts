import * as $ from 'jquery';
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
import { ui } from '../ui';
import { Shareable, ShareVisible, SharePayload, ShareInfos, ShareAction } from '../rights';
export interface ShareCloseDelegate {
    $canceled: boolean
    $close: () => void
}
export interface ShareableWithId extends Shareable {
    _id: string
}
export interface SharePanelScope {
    display: {
        showSaveSharebookmarkInput: boolean,
        sharebookmarkSaved: boolean,
        workflowAllowSharebookmarks: boolean,
        showCloseConfirmation: boolean,
        showBookmarkMembers: boolean,
        search: {
            processing: Boolean
        }
    }
    sharing: {
        actions?: ShareAction[]
    }
    varyingRights: boolean
    editResources: Shareable[]
    sharingModel: ShareInfos & { edited: any[], editedInherited: any[], changed?: boolean, sharebookmarks?: any }
    appPrefix: string
    shareTable: string
    resources: ShareableWithId[] | ShareableWithId
    maxResults: number
    translate: any
    actions: ShareAction[]
    search: string
    found: ShareVisible[]
    maxEdit: number
    onValidate?(args: {
        $data: SharePayload,
        $resource: ShareableWithId,
        $actions: ShareAction[]
    })
    canEditDelegate?(args: {
        $item: { type: string, id: string }
    }): boolean
    autoClose?: boolean
    canEdit(item: { type: string, id: string }): boolean
    confirmationCloseDelegate?(args: ShareCloseDelegate)
    closeDelegate?(args: ShareCloseDelegate)
    onCancel?()
    onSubmit?(args: { $shared: SharePayload })
    onFeed?(args: {
        $data: SharePayload,
        $resource: ShareableWithId,
        $actions: ShareAction[]
    })
    isSubmitDisabled(): boolean
    createSharebookmark(name: string)
    typeSort(sort: any)
    closePanel(cancelled: boolean)
    revertClose()
    getColor(profile): any
    remove(el: ShareVisible)
    displayMore()
    changeAction(item, action: ShareAction)
    share()
    findUserOrGroup()
    addResults()
    addEdit(item)
    clearSearch()
    canShowMore(): boolean
    //angular
    $on(a, b)
    $apply(a?)
    $watch(a?, b?)
    $watchCollection(a?, b?)
}
export const sharePanel = ng.directive('sharePanel', ['$rootScope', ($rootScope) => {
    return {
        scope: {
            resources: '=',
            appPrefix: '=',
            onCancel: '&?',
            onSubmit: '&?',
            onValidate: '&?',
            onFeed: '&?',
            closeDelegate: '&?',
            confirmationCloseDelegate: '&?',
            canEditDelegate: '&?',
            autoClose: '='
        },
        restrict: 'E',
        templateUrl: '/' + appPrefix + '/public/template/entcore/share-panel.html',
        link: function ($scope: SharePanelScope, $element, $attributes) {
            var currentApp = appPrefix;
            var usersCache = {};
            const onFeedEvent = function (data: SharePayload, resource: ShareableWithId, actions: ShareAction[]) {
                if ($attributes.onFeed) {
                    $scope.onFeed({ '$data': data, '$resource': resource, '$actions': actions })
                }
            }
            $scope.display = {
                showSaveSharebookmarkInput: false,
                sharebookmarkSaved: false,
                workflowAllowSharebookmarks: false,
                showCloseConfirmation: false,
                showBookmarkMembers: false,
                search: {
                    processing: false
                }
            }

            // get directory workflow to manage allowSharebookmarks workflow
            async function loadDirectoryWorkflow() {
                await model.me.workflow.load(['directory']);
                $scope.display.workflowAllowSharebookmarks = model.me.workflow.directory.allowSharebookmarks;
                $scope.$apply();
            }
            loadDirectoryWorkflow();

            if ($scope.appPrefix) {
                currentApp = $scope.appPrefix;
            }

            $scope.shareTable = '/' + appPrefix + '/public/template/entcore/share-panel-table.html';

            if (!($scope.resources instanceof Array) && !$scope.resources.myRights && !($scope.resources instanceof Model)) {
                throw new TypeError('Resources in share panel must be instance of Array or implement Rights interface');
            }
            if (!($scope.resources instanceof Array)) {
                $scope.resources = [$scope.resources];
            }

            $scope.sharing = {};
            $scope.found = [];
            $scope.maxResults = 5;

            $scope.editResources = [];
            $scope.sharingModel = {
                edited: [],
                changed: false
            } as any;
            $scope.canEdit = function (item) {
                if ($attributes.canEditDelegate) {
                    return $scope.canEditDelegate({ $item: item });
                }
                return true;
            }
            $scope.addResults = function () {
                $scope.maxResults += 5;
            };

            var actionsConfiguration = {};

            http().get('/' + infraPrefix + '/public/json/sharing-rights.json').done(function (config) {
                actionsConfiguration = config;
            });

            $scope.translate = idiom.translate;

            function actionToRights(action) {
                var rights = [];
                _.where($scope.actions, { displayName: action }).forEach(function (item) {
                    item.name.forEach(function (i) {
                        rights.push(i);
                    });
                });

                return rights;
            }

            function rightsToActions(rights, http?) {
                var actions = {};

                rights.forEach(function (right) {
                    var action = _.find($scope.actions, function (action: ShareAction) {
                        return action.name.indexOf(right) !== -1
                    });

                    if (!action) {
                        return;
                    }

                    if (!actions[action.displayName]) {
                        actions[action.displayName] = true;
                    }
                });

                return actions;
            }

            function setActions(actions: ShareAction[]) {
                $scope.actions = actions;
                $scope.actions.forEach(function (action) {
                    var actionId = action.displayName.split('.')[1];
                    if (actionsConfiguration[actionId]) {
                        action.priority = actionsConfiguration[actionId].priority;
                        action.requires = actionsConfiguration[actionId].requires;
                    }
                });
            }

            function differentRights(model1, model2) {
                var result = false;
                function different(type) {
                    for (var element in model1[type].checked) {
                        if (!model2[type].checked[element]) {
                            return true;
                        }

                        model1[type].checked[element].forEach(function (right) {
                            result = result || model2[type].checked[element].indexOf(right) === -1
                        });
                    }

                    return result;
                }

                return different('users') || different('groups');
            }

            var feeding = false;
            var feedData = function () {
                if (feeding) {
                    return;
                }
                feeding = true;
                var initModel = true;
                if (!($scope.resources as ShareableWithId[]).length) {
                    feeding = false;
                }
                ($scope.resources as ShareableWithId[]).forEach(function (resource) {
                    var id = resource._id;
                    http().get('/' + currentApp + '/share/json/' + id + '?search=').done(function (data) {
                        onFeedEvent(data, resource, data.actions)
                        if (initModel) {
                            data.users.visibles.map(user => user.type = 'user');
                            data.groups.visibles.map(group => group.type = 'group');

                            $scope.sharingModel = data;
                            $scope.sharingModel.edited = [];
                            $scope.sharingModel.editedInherited = [];
                        }

                        data._id = resource._id;
                        $scope.editResources.push(data);
                        const editResource = $scope.editResources[$scope.editResources.length - 1];
                        if (!$scope.sharing.actions) {
                            setActions(data.actions);
                        }

                        function addToEdit(type) {
                            for (let element in editResource[type].checked) {
                                const rights = editResource[type].checked[element];

                                const groupActions = rightsToActions(rights);
                                const elementObjOriginal = _.findWhere(editResource[type].visibles, {
                                    id: element
                                });
                                if (elementObjOriginal) {
                                    const elementObj = { ...elementObjOriginal };
                                    elementObj.actions = groupActions;
                                    if (initModel) {
                                        $scope.sharingModel.edited.push(elementObj);
                                    }

                                    elementObj.index = $scope.sharingModel.edited.length;
                                }
                            }
                            //inherit checked
                            if (editResource[type].checkedInherited) {
                                const checkedInherited = editResource[type].checkedInherited;
                                for (let element in checkedInherited) {
                                    const rights = checkedInherited[element];

                                    const groupActions = rightsToActions(rights);
                                    const elementObjOriginal = _.findWhere(editResource[type].visibles, {
                                        id: element
                                    });
                                    if (elementObjOriginal) {
                                        const elementObj = { ...elementObjOriginal };
                                        elementObj.actions = groupActions;
                                        if (initModel) {
                                            $scope.sharingModel.editedInherited.push(elementObj);
                                        }

                                        elementObj.index = $scope.sharingModel.editedInherited.length;
                                    }
                                }
                            }
                        }

                        addToEdit('groups');
                        addToEdit('users');

                        if (!initModel) {
                            if (differentRights(editResource, $scope.sharingModel) || differentRights($scope.sharingModel, editResource)) {
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
            $scope.canShowMore = function () {
                let count = 0;
                if ($scope.sharingModel.edited && $scope.sharingModel.edited.length) {
                    count += $scope.sharingModel.edited.length;
                }
                if ($scope.sharingModel.editedInherited && $scope.sharingModel.editedInherited.length) {
                    count += $scope.sharingModel.editedInherited.length;
                }
                return count > $scope.maxEdit;
            }
            $scope.isSubmitDisabled = function () {
                let hasUnchecked = false;
                for (let item of $scope.sharingModel.edited) {
                    let allUnckecked = true;
                    for (let a of $scope.actions) {
                        if (item.actions[a.displayName]) {
                            allUnckecked = false;
                        }
                    }
                    if (allUnckecked) {
                        hasUnchecked = true;
                    }
                }
                const hasNotChanged = !$scope.sharingModel.changed;
                return hasNotChanged || hasUnchecked;
            }
            $scope.$watch('resources', function () {
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

            $scope.$watchCollection('resources', function () {
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

            $scope.addEdit = function (item) {
                item.actions = {};
                $scope.sharingModel.edited.push(item);
                item.index = $scope.sharingModel.edited.length;
                var addedIndex = $scope.found.indexOf(item);
                $scope.found.splice(addedIndex, 1);

                var defaultActions = []
                $scope.actions.forEach(function (action) {
                    var actionId = action.displayName.split('.')[1];
                    if (actionsConfiguration[actionId].default) {
                        item.actions[action.displayName] = true;
                        defaultActions.push(action);
                    }
                });

                if (item.type == 'sharebookmark') {
                    http().get('/directory/sharebookmark/' + item.id).done(function (data) {
                        item.users = data.users;
                        item.groups = data.groups;
                        if (item.users) {
                            item.users.forEach(user => {
                                user.type = 'sharebookmark-user';
                                user.actions = {};
                                defaultActions.forEach(defaultAction => {
                                    user.actions[defaultAction.displayName] = true;
                                });
                            });
                        }

                        if (item.groups) {
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

            $scope.clearSearch = function () {
                $scope.sharingModel.groups = [] as any;
                $scope.sharingModel.users = [] as any;
                $scope.found = [];
            }

            $scope.findUserOrGroup = function () {
                var searchTerm = idiom.removeAccents($scope.search).toLowerCase();
                var startSearch = Me.session.functions.ADMIN_LOCAL ? searchTerm.substr(0, 3) : '';
                if (!usersCache[startSearch] && !(usersCache[startSearch] && usersCache[startSearch].loading)) {
                    usersCache[startSearch] = { loading: true };
                    var id = $scope.resources[0]._id;
                    var path = '/' + currentApp + '/share/json/' + id + '?search=' + startSearch;
                    if (!startSearch) {
                        path = '/' + currentApp + '/share/json/' + id;
                    }
                    http().get(path).done(function (data) {
                        data.users.visibles.map(user => user.type = 'user');
                        data.groups.visibles.map(group => group.type = 'group');

                        usersCache[startSearch] = { groups: data.groups, users: data.users };
                        $scope.sharingModel.groups = usersCache[startSearch].groups;
                        $scope.sharingModel.users = usersCache[startSearch].users;

                        if (model.me.workflow.directory.allowSharebookmarks == true) {
                            http().get('/directory/sharebookmark/all').done(function (data) {
                                var bookmarks = _.map(data, function (bookmark) {
                                    bookmark.type = 'sharebookmark';
                                    return bookmark;
                                });
                                usersCache[startSearch]['sharebookmarks'] = bookmarks;

                                $scope.findUserOrGroup();
                                $scope.$apply();
                            });
                        } else {
                            $scope.findUserOrGroup();
                            $scope.$apply();
                        }
                    });
                    return;
                }
                $scope.sharingModel.groups = usersCache[startSearch].groups;
                $scope.sharingModel.users = usersCache[startSearch].users;
                $scope.sharingModel.sharebookmarks = usersCache[startSearch].sharebookmarks;

                $scope.found = _.union(
                    _.filter($scope.sharingModel.sharebookmarks, function (bookmark) {
                        var testName = idiom.removeAccents(bookmark.name).toLowerCase();
                        return testName.indexOf(searchTerm) !== -1 && $scope.sharingModel.edited.find(i => i.id === bookmark.id) === undefined;
                    }),
                    _.filter($scope.sharingModel.groups.visibles, function (group) {
                        var testName = idiom.removeAccents(group.name).toLowerCase();
                        return testName.indexOf(searchTerm) !== -1 && $scope.sharingModel.edited.find(i => i.id === group.id) === undefined;
                    }),
                    _.filter($scope.sharingModel.users.visibles, function (user) {
                        var testName = idiom.removeAccents(user.lastName + ' ' + user.firstName).toLowerCase();
                        var testNameReversed = idiom.removeAccents(user.firstName + ' ' + user.lastName).toLowerCase();
                        var testUsername = idiom.removeAccents(user.username).toLowerCase();
                        return (testName.indexOf(searchTerm) !== -1 || testNameReversed.indexOf(searchTerm) !== -1) || testUsername.indexOf(searchTerm) !== -1 && $scope.sharingModel.edited.find(i => i.id === user.id) === undefined;
                    })
                );
                $scope.found = _.filter($scope.found, function (element) {
                    return $scope.sharingModel.edited.findIndex(i => i.id === element.id) === -1;
                })

                $scope.display.search.processing = false
                $scope.$apply();
            };

            $scope.remove = function (element) {
                $scope.sharingModel.edited = _.reject($scope.sharingModel.edited, function (item) {
                    return item.id === element.id;
                });
                $scope.sharingModel.changed = true;
                $scope.display.showSaveSharebookmarkInput = false;
                $scope.display.sharebookmarkSaved = false
            }

            $scope.maxEdit = 3;

            $scope.displayMore = function () {
                let displayMoreInc = 5;
                $scope.maxEdit += displayMoreInc;
            }

            $scope.changeAction = function (item, action) {
                function requiredActions(item, action) {
                    if (!item.actions[action.displayName]) {
                        _.filter($scope.actions, function (i) {
                            return _.find(i.requires, function (dependency) {
                                return action.displayName.split('.')[1].indexOf(dependency) !== -1;
                            }) !== undefined
                        })
                            .forEach(function (i) {
                                if (i) {
                                    item.actions[i.displayName] = false;
                                }
                            })
                    } else {
                        action.requires.forEach(function (required) {
                            var action = _.find($scope.actions, function (action) {
                                return action.displayName.split('.')[1].indexOf(required) !== -1;
                            });
                            if (action) {
                                item.actions[action.displayName] = true;
                            }
                        });
                    }
                }

                if (item.type == 'sharebookmark') {
                    item.users.forEach(user => {
                        user.actions[action.displayName] = item.actions[action.displayName];
                        requiredActions(user, action);
                    });

                    item.groups.forEach(group => {
                        group.actions[action.displayName] = item.actions[action.displayName];
                        requiredActions(group, action);
                    });
                }

                if (item.type == 'sharebookmark-user' || item.type == 'sharebookmark-group') {
                    var element = $scope.sharingModel.edited.find(edited => edited.id == item.id);
                    if (element) {
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

            $scope.share = async function () {
                $scope.sharingModel.changed = false;

                const data: SharePayload = {};
                const users: { [key: string]: string[] } = {};
                const groups: { [key: string]: string[] } = {};
                const sharebookmarks: { [key: string]: string[] } = {};

                $scope.sharingModel.edited.forEach(function (item) {
                    let rights = [];
                    for (let action in item.actions) {
                        if (item.actions.hasOwnProperty(action)
                            && item.actions[action] == true) {
                            rights = rights.concat(actionToRights(action));
                        }
                    }

                    if (item.type == 'sharebookmark') {
                        sharebookmarks[item.id] = rights;
                    } else if (item.type == 'user' || item.type == 'sharebookmark-user') {
                        users[item.id] = rights;
                    } else {
                        groups[item.id] = rights;
                    }
                });

                data['users'] = users;
                data['groups'] = groups;
                data['bookmarks'] = sharebookmarks;

                const promises = ($scope.resources as ShareableWithId[]).map(async function (resource) {
                    // if user can share resource => add user to share users array
                    if (resource.myRights
                        && (resource.myRights['share'] != undefined
                            || resource.myRights['manage'] != undefined
                            || resource.myRights['manager'] != undefined)
                        && resource.shared) {
                        let rights: string[] = [];
                        let myRights = resource.shared.find(sharedItem => sharedItem.userId == model.me.userId);

                        if (myRights) {
                            Object.keys(myRights).forEach(key => {
                                if (myRights[key] == true && key != 'userId') {
                                    rights.push(key);
                                }
                            });

                            users[model.me.userId] = rights;
                            data['users'] = users;
                        }
                    }
                    if ($attributes.onValidate) {
                        try {
                            await $scope.onValidate({ '$data': data, '$resource': resource, '$actions': $scope.actions })
                        } catch (e) {
                            return Promise.reject(e);
                        }
                    }
                    return new Promise((resolve, reject) => {
                        http().putJson('/' + currentApp + '/share/resource/' + resource._id, data)
                            .done(function (res) {
                                $rootScope.$broadcast('share-updated', res['notify-timeline-array']);
                                resolve()
                            })
                            .error(function () {
                                reject()
                            });
                    })
                });
                try {
                    await Promise.all(promises);
                    notify.success('share.notify.success');
                } catch (e) {
                    notify.error('share.notify.error');
                }
                if ($scope.autoClose) {
                    await $scope.closePanel(false);
                }
                $attributes.onSubmit && $scope.onSubmit({ '$shared': data })
            }

            $scope.createSharebookmark = function (newSharebookmarkName) {
                if (model.me.workflow.directory.allowSharebookmarks == true) {
                    let members = [];
                    $scope.sharingModel.edited.forEach(item => {
                        if (item.type == 'user' || item.type == 'group') {
                            members.push(item.id);
                        } else { // if it is a sharebookmark
                            if (item.users) {
                                item.users.forEach(user => members.push(user.id));
                            }
                            if (item.groups) {
                                item.groups.forEach(group => members.push(group.id));
                            }
                        }
                    })
                    let data = {
                        "name": newSharebookmarkName,
                        "members": members
                    };

                    http().postJson('/directory/sharebookmark', data).done(res => {
                        $scope.display.sharebookmarkSaved = true;
                        $scope.$apply();
                    });
                }
            }

            $scope.typeSort = function (value) {
                if (value.type == 'sharebookmark') return 0;
                if (value.type == 'group') return 1;
                return 2;
            }
            const doClose = async () => {
                $element.closest('.lightbox').first().fadeOut();
                $('body').css({ overflow: 'auto' });
                $('body').removeClass('lightbox-opened');

                $element.closest('.lightbox').find('.content > .close-lightbox').css({ visibility: 'visible' });
                const isolatedScope = $element.closest('lightbox').isolateScope();
                if (isolatedScope) {
                    isolatedScope.$eval(isolatedScope.onClose);
                    isolatedScope.show = false;
                    isolatedScope.$parent.$apply();
                }
                $scope.display.showCloseConfirmation = false;
                await feedData();

                $scope.$apply();
            }
            $scope.closePanel = async function (cancelled = true) {
                if ($attributes.closeDelegate) {
                    $scope.closeDelegate({ "$canceled": cancelled, "$close": doClose })
                } else {
                    await doClose()
                }
                if (cancelled) {
                    $attributes.onCancel && $scope.onCancel();
                }
            }

            $scope.revertClose = function () {
                $element.closest('.lightbox').find('.content > .close-lightbox').css({ visibility: 'visible' });
                $scope.display.showCloseConfirmation = false;
                $scope.$apply();
            }
            const closeCallback = function (e) {
                e.stopPropagation();
                if (!$scope.sharingModel.changed)
                    $scope.closePanel(true);
                else if (!$scope.display.showCloseConfirmation) {
                    if ($attributes.confirmationCloseDelegate) {
                        $scope.confirmationCloseDelegate({ "$canceled": true, "$close": doClose })
                        return;
                    }
                    $scope.display.showCloseConfirmation = true;
                    $element.closest('.lightbox').find('.content > .close-lightbox').css({ visibility: 'hidden' });
                    $scope.$apply();
                }
                $scope.$apply();
            };
            $element.closest('.lightbox').find('.background, .content > .close-lightbox').on('click', closeCallback);
            $scope.getColor = function (profile) {
                return ui.profileColors.match(profile);
            };
            //unbind event
            $scope.$on("$destroy", function () {
                $element.closest('.lightbox').find('.background, .content > .close-lightbox').off('click', closeCallback)
            });
        }
    }
}]);
