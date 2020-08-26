import { ng } from '../ng-start';

//function to compile template recursively
function compileRecursive($compile, element, link) {
    // Normalize the link parameter
    if (angular.isFunction(link)) {
        link = { post: link };
    }
    // Break the recursion loop by removing the contents
    const contents = element.contents().remove();
    let compiledContents;
    return {
        pre: (link && link.pre) ? link.pre : null,
        /**
         * Compiles and re-adds the contents
         */
        post: function (scope, element) {
            // Compile the contents
            if (!compiledContents) {
                compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element
            compiledContents(scope, function (clone) {
                element.append(clone);
            });

            // Call the post-linking function, if any
            if (link && link.post) {
                link.post.apply(null, arguments);
            }
        }
    };
}

export const structureTree = ng.directive('structureTree', ['$compile', ($compile) => {
    return {
        restrict: 'E',
        scope: {
            items: '=',
            select: '&'
        },
        template: `
            <ul>
                <li ng-repeat="item in items"
                    ng-class="{active: isSelected(item)}">
                    <span ng-click="toggleChildren($event)"
                        ng-class="{caret: (item.children && item.children.length > 0) || (item.classes && item.classes.length > 0)}"></span>
                    <span ng-click="selectItem(item.id)">[[item.name]]</span>
                    <ul class="nested" ng-if="item.children && item.children.length > 0">
                        <structure-tree items="item.children" select="bubbleSelect(id)"></structure-tree>
                    </ul>
                    <ul class="nested" ng-if="item.classes && item.classes.length > 0">
                        <li ng-repeat="class in item.classes" 
                            ng-click="selectItem(class.id)"
                            ng-class="{active: isSelected(class)}">[[class.name]]</li>
                    </ul>
                </li>
            </ul>
        `,
        compile: function (element) {
            // Use the compile function from the RecursionHelper,
            // And return the linking function(s) which it returns
            return compileRecursive($compile, element, (scope) => {
                scope.safeApply = function (fn) {
                    const phase = this.$root.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn && (typeof (fn) === 'function')) {
                            fn();
                        }
                    } else {
                        this.$apply(fn);
                    }
                };
                
                scope.toggleChildren = function($event) {
                    const nestedElement = $event.target.parentElement.querySelector(".nested");
                    if (nestedElement) {
                        nestedElement.classList.toggle("unfolded");
                    }
                    $event.target.classList.toggle("caret-down");
                };
                
                scope.selectItem = function(id: string) {
                    scope.select({'id': id});
                    scope.selectedItemId = id;
                };
                
                scope.bubbleSelect = function(id: string) {
                    scope.select({'id': id});
                };
                
                scope.isSelected = function(item: {id: string, name: string}) {
                    return item.id === scope.selectedItemId;
                };         
            });
        }
    }
}])