import { ng, _, idiom } from '../entcore';

/**
 * @description Add groups and users to lists, selector available for viewing which users are in a specific group.
 * @param groupsList List of all the groups added. A group should at least contain :
 * {
 *      id (or _id) :number => The id of the group.
 *      name :string => The name of the group.
 *      groupOrUser: string => ("group")
 *      selected :boolean => (false) Indicates whether the group is selected or not.
 *      exclude :boolean => (false) Indicates whether the group is excluded or not.
 * }
 * @param usersList List of all the users added. An user should at least contain :
 * {
 *      id (or _id) :number => The id of the user.
 *      name :string => The name of the user.
 *      groupOrUser: string => ("user")
 *      groupId :number => The id of the parent group.
 *      selected :boolean => Indicates whether the user is selected or not.
 *      exclude :boolean => (false) Indicates whether the user is excluded or not.
 * }
 * @param selector All the primitive variables needed in two way data-binding. The object should at least contain :
 * {
 *      search :number => The string for the users search field.
 *      selectedGroup :boolean => Indicates whether a group is selected or not.
 * }
 * @example
 *  <groups-users-selector
        groups-list="<groupsList>"
        users-list="<usersList>"
        selector="<selector>">
    </groups-users-selector>
 */

export const groupsUsersSelector = ng.directive('groupsUsersSelector', () => {
    return {
        restrict: 'E',
        template: `
            <div class="flex-row align-start vertical-spacing-twice">
                <div class="cell six horizontal-spacing">
                    <h4><i18n>portal.group.added</i18n></h4>
                    <div style="overflow-y: auto; max-height: 210px;">
                        <contact-chip class="block relative removable" ng-class="{selected: group.selected}"
                            ng-model="group"
                            action="selectGroupItem(item)"
                            action-icon="removeItem(item)"
                            ng-repeat="group in groupsList"
                            isgroup stickernotselected>
                        </contact-chip>
                        <div class="small-text" data-ng-if="groupsList.length === 0">
                            <i18n>portal.group.none.added</i18n>
                        </div>
                    </div>
                </div>
                <div class="cell six horizontal-spacing">
                    <h4><i18n>portal.user.added</i18n></h4>
                    <div class="small-text row" data-ng-if="usersList.length > 0">
                        <input type="text" class="six cell" autocomplete="off" ng-model="selector.search" i18n-placeholder="portal.search" /><span class="one cell">&nbsp;</span><label>[[getTotalUser().ok]] <i18n>portal.users</i18n></label>
                    </div>
                    <div id="userScroll" style="overflow-y: auto; max-height: 170px;">
                    <contact-chip id='user-[[id(user)]]' class="block relative removable" ng-class="{selected: user.selected}"
                        ng-if="!user.exclude"
                        ng-model="user"
                        action="removeItem(item)"
                        ng-repeat="user in usersList | filter:filterAllUser()"
                        stickernotselected>
                    </contact-chip>
                        <div class="small-text" data-ng-if="usersList.length === 0">
                            <i18n>portal.user.none.added</i18n>
                        </div>
                    </div>
                </div>
            </div>
        `,

        scope: {
            groupsList: '=',
            usersList: '=',
            selector: '='
        },

        link: (scope, element, attributes) => {
            scope.id = function(item) {
                return item.id ? item.id : item._id;
            }

            function clearSelectedList(selectedGroupItem) {
                _.forEach(scope.groupsList, group => {
                    if (selectedGroupItem && (scope.id(selectedGroupItem) === scope.id(group))) {
                        return;
                    }
                    group.selected = false; 
                });

                _.forEach(scope.usersList, user => {
                    user.selected = false;
                });
            }

            scope.selectGroupItem = function (selectedItem) {
                clearSelectedList(selectedItem);
                selectedItem.selected = !selectedItem.selected;
                scope.selector.selectedGroup = selectedItem.selected;
                _.forEach(scope.usersList, user => {
                    if (user.groupId === scope.id(selectedItem)) {
                        user.selected = selectedItem.selected;
                    }
                });
            };

            scope.removeItem = function (selectedItem) {
                var list = (selectedItem.groupOrUser == 'group') ? scope.groupsList : scope.usersList;

                if (selectedItem.groupOrUser === 'group') {
                    scope.usersList = _.reject(scope.usersList, (user) => {
                        return (user && user.groupId && scope.id(selectedItem) === user.groupId);
                    });
                } else {
                   if (selectedItem.groupId) {
                       selectedItem.exclude = true;

                       var isEmptyGroup = true;
                       //check not empty group else erase the group
                       _.forEach(scope.usersList, (user) => {
                           if (selectedItem.groupId === user.groupId && !user.exclude) {
                               isEmptyGroup = false;
                               return false;
                           }
                       });

                       if (isEmptyGroup) {
                           // delete group
                           scope.groupsList = _.reject(scope.groupsList, (group) => {
                               return (group && selectedItem.groupId === scope.id(group));
                           });
                           //delete members
                           scope.usersList = _.reject(scope.usersList, (user) => {
                               return (user && user.groupId && selectedItem.groupId === user.groupId);
                           });
                       } else {
                           scope.selector.selectedGroup = true;
                       }

                       //ERASE same user in implict user (not from group)
                       scope.usersList = _.reject(scope.usersList, (user) => {
                           return (user && !user.exclude && selectedItem.name === user.name);
                       });
                   }

                    //mark same user of another group as exclude
                    _.forEach(scope.usersList, (user) => {
                        if (user && user.groupId && selectedItem.name === user.name) {
                            user.exclude = true;
                        }
                    });
                }

                if (!selectedItem.exclude) {
                    var index = list.indexOf(selectedItem);
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                }
            };

            scope.getTotalUser = function() {
                return (scope.usersList && scope.usersList.length > 0) ? _.countBy(scope.usersList, function(user) {
                    return (user && user.exclude === true) ? 'exclude': 'ok';
                }) : {"ok":0};
            };

            scope.filterAllUser = function () {
                return function (user) {
                    var searchTerm =  idiom.removeAccents(scope.selector.search).toLowerCase();

                    if(!searchTerm){
                        return true;
                    }
                    return idiom.removeAccents(user.name).toLowerCase().indexOf(searchTerm) !== -1;
                };
            };
        }
    };
});