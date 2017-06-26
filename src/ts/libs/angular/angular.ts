require('angular');
require('angular-route');
require('angular-sanitize');

export var angular = (window as any).angular;
if(!(window as any).entcore){
    (window as any).entcore = {};
}
(window as any).entcore.angular = angular;