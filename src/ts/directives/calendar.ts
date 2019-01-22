import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { model } from '../modelDefinitions';
import { moment } from '../libs/moment/moment';
import { _ } from '../libs/underscore/underscore';
import { calendar } from '../calendar';
import { template } from '../template';
import { $ } from '../libs/jquery/jquery';
import { Me } from '../me';


export let calendarComponent = ng.directive('calendar', function () {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: '/' + appPrefix + '/public/template/entcore/calendar.html',
        controller: ['$scope', '$timeout', function ($scope, $timeout) {
            var refreshCalendar = function () {
                model.calendar.clearScheduleItems();
                $scope.items = _.where(_.map($scope.items, function (item) {
                    item.beginning = item.startMoment;
                    item.end = item.endMoment;
                    return item;
                }), { is_periodic: false });
                model.calendar.addScheduleItems($scope.items);
                $scope.calendar = model.calendar;
                $scope.moment = moment;
                $scope.display.editItem = false;
                $scope.display.createItem = false;

                let calendar_options = {showQuarterHours:false};
                $scope.toogleQuarterHours = () => {
                    if(!Me.preferences.calendar_options){
                        Me.preferences.calendar_options = {};
                    }
                    Me.preferences.calendar_options["showQuarterHours"] = $scope.display.showQuarterHours;
                    Me.savePreference('calendar_options');
                };
                async function initCalendarOptions() {
                    calendar_options = await Me.preference('calendar_options');
                    $scope.display.showQuarterHours = calendar_options["showQuarterHours"];
                }
                if ($scope.display.showQuarterHoursOption) {
                    initCalendarOptions();
                }

                $scope.editItem = function (item) {
                    $scope.calendarEditItem = item;
                    $scope.display.editItem = true;
                };

                $scope.createItem = function (day, timeslot) {
                    $scope.newItem = {};
                    let year = model.calendar.firstDay.year() || (day.date && day.date.year());
                    if (day.index < model.calendar.firstDay.dayOfYear()) {
                        year++;
                    }
                    if (!timeslot) {
                        timeslot = {
                            start: calendar.startOfDay,
                            end: calendar.endOfDay
                        }
                    }
                    $scope.newItem.beginning = moment().utc().year(year).dayOfYear(day.index).hour(timeslot.start);
                    $scope.newItem.end = moment().utc().year(year).dayOfYear(day.index).hour(timeslot.end);
                    model.calendar.newItem = $scope.newItem;
                    model.calendar.eventer.trigger('calendar.create-item');
                    $scope.onCreateOpen();
                };

                $scope.closeCreateWindow = function () {
                    $scope.display.createItem = false;
                    $scope.onCreateClose();
                };

                $scope.updateCalendarDate = function() {
                    model.calendar.setDate(model.calendar.firstDay);
                };

                $scope.previousTimeslots = function () {
                    calendar.startOfDay--;
                    calendar.endOfDay--;
                    model.calendar.initTimeSlots();
                    model.calendar.days.sync();
                    refreshCalendar();
                };

                $scope.nextTimeslots = function () {
                    calendar.startOfDay++;
                    calendar.endOfDay++;
                    model.calendar.initTimeSlots();
                    model.calendar.days.sync();
                    refreshCalendar();
                };

                $scope.openMorePopup = function(items) {
                    $scope.morePopupItems = items;
                    $scope.display.moreItems = true;
                };
            };
            $scope.getMonthDayOffset = function(day) {
                return (day.date.day() || 7) - 1; // sunday is 0, so set it to 7
            };

            calendar.setCalendar = function (cal) {
                model.calendar = cal;
                refreshCalendar();
            };

            $timeout(function () {
                refreshCalendar();
                $scope.$watchCollection('items', refreshCalendar);
            }, 0);
            $scope.refreshCalendar = refreshCalendar;

            $scope.$watch('display.mode', function() {
                model.calendar.setIncrement($scope.display.mode);
                refreshCalendar();
            });
        }],
        link: function (scope, element, attributes) {
            var allowCreate;

            if (attributes.itemTooltipTemplate) {
                scope.itemTooltipTemplate = attributes.itemTooltipTemplate;
            }

            scope.display = {
                readonly: false,
                mode: 'week',
                enableModes: attributes.enableDisplayModes === 'true',
                showQuarterHours: false,
                showQuarterHoursOption:  attributes.showQuarterHours === 'true',
                showNextPreviousButton: attributes.showNextPreviousButton === 'true'
            };
            attributes.$observe('createTemplate', function () {
                if (attributes.createTemplate) {
                    template.open('schedule-create-template', attributes.createTemplate);
                    allowCreate = true;
                }
            });

            attributes.$observe('displayTemplate', () => {
                if (attributes.displayTemplate) {
                    template.open('schedule-display-template', attributes.displayTemplate);
                }
            });

            attributes.$observe('displayMonthTemplate', () => {
                if (attributes.displayMonthTemplate) {
                    template.open('schedule-display-month-template', attributes.displayMonthTemplate);
                }
                if (attributes.moreItemsTemplate) {
                    template.open('schedule-more-items-template', attributes.moreItemsTemplate);
                }
            });

            scope.items = scope.$eval(attributes.items);
            scope.onCreateOpen = function () {
                if (!allowCreate) {
                    return;
                }
                scope.$eval(attributes.onCreateOpen);
                scope.display.createItem = true;
            };
            scope.onCreateClose = function () {
                scope.$eval(attributes.onCreateClose);
            };
            scope.$watch(function () {
                return scope.$eval(attributes.items)
            }, function (newVal) {
                scope.items = newVal;
            });

        }
    }
});

export let scheduleItem = ng.directive('scheduleItem', function () {
    return {
        restrict: 'E',
        require: '^calendar',
        template: '<div class="schedule-item" resizable horizontal-resize-lock draggable>' +
        '<container template="schedule-display-template" class="absolute"></container>' +
        '</div>',
        controller: ['$scope', function ($scope) {

        }],
        link: function (scope, element, attributes) {
            var parentSchedule = element.parents('.schedule');
            var scheduleItemEl = element.children('.schedule-item');
            if (scope.item.beginning.dayOfYear() !== scope.item.end.dayOfYear()
                || moment().diff(moment(scope.item.end_date)) > 0
                || scope.item.locked) {
                scheduleItemEl.removeAttr('resizable');
                scheduleItemEl.removeAttr('draggable');
                scheduleItemEl.unbind('mouseover');
                scheduleItemEl.unbind('click');
                scheduleItemEl.data('lock', true);
            }

            var getTimeFromBoundaries = function () {
                // compute element positon added to heiht of 7 hours ao avoid negative value side effect
                var topPos = scheduleItemEl.position().top + (calendar.dayHeight * calendar.startOfDay);
                var startTime = moment().utc();
                startTime.hour(Math.floor(topPos / calendar.dayHeight));
                startTime.minute((topPos % calendar.dayHeight) * 60 / calendar.dayHeight);

                var endTime = moment().utc();
                endTime.hour(Math.floor((topPos + scheduleItemEl.height()) / calendar.dayHeight));
                endTime.minute(((topPos + scheduleItemEl.height()) % calendar.dayHeight) * 60 / calendar.dayHeight);

                startTime.year(model.calendar.firstDay.year());
                endTime.year(model.calendar.firstDay.year());

                var days = element.parents('.schedule').find('.day');
                var center = scheduleItemEl.offset().left + scheduleItemEl.width() / 2;
                var dayWidth = days.first().width();
                days.each(function (index, item) {
                    var itemLeft = $(item).offset().left;
                    if (itemLeft < center && itemLeft + dayWidth > center) {
                        var dayDate = model.calendar.firstDay.clone().add(index, 'days');

                        endTime.year(dayDate.year());
                        endTime.month(dayDate.month());
                        endTime.date(dayDate.date());

                        startTime.year(dayDate.year());
                        startTime.month(dayDate.month());
                        startTime.date(dayDate.date());
                    }
                });

                return {
                    startTime: startTime,
                    endTime: endTime
                }
            };

            scheduleItemEl.on('stopResize', function () {
                var newTime = getTimeFromBoundaries();
                scope.item.beginning = newTime.startTime;
                scope.item.end = newTime.endTime;
                model.calendar.eventer.trigger('calendar.resize-item', scope.item);
                if (typeof scope.item.calendarUpdate === 'function') {
                    scope.item.calendarUpdate();
                    model.calendar.clearScheduleItems();
                    model.calendar.addScheduleItems(scope.$parent.items);
                    scope.$parent.$apply('items');
                }
            });

            scheduleItemEl.on('stopDrag', function () {
                var newTime = getTimeFromBoundaries();
                scope.item.beginning = newTime.startTime;
                scope.item.end = newTime.endTime;
                model.calendar.eventer.trigger('calendar.drop-item', scope.item);
                if (typeof scope.item.calendarUpdate === 'function') {
                    scope.item.calendarUpdate();
                    model.calendar.clearScheduleItems();
                    model.calendar.addScheduleItems(scope.$parent.items);
                    scope.$parent.$apply('items');
                    parentSchedule.find('schedule-item').each(function (index, item) {
                        var scope = angular.element(item).scope();
                        scope.placeItem()
                    });
                }
            });

            var placeItem = function () {
                var dayWidth = parentSchedule.find('.day').width();
                var cellWidth = element.parent().width() / 12;
                var startDay = scope.item.beginning.dayOfYear();
                var endDay = scope.item.end.dayOfYear();
                var hours = calendar.getHours(scope.item, scope.day);

                var itemWidth = scope.day.scheduleItems.scheduleItemWidth(scope.item);
                scheduleItemEl.css({ width: itemWidth + '%' });
                var calendarGutter = 0;
                var collision = true;
                while (collision) {
                    collision = false;
                    scope.day.scheduleItems.forEach(function (scheduleItem) {
                        if (scheduleItem === scope.item) {
                            return;
                        }
                        if (scheduleItem.beginning < scope.item.end && scheduleItem.end > scope.item.beginning) {
                            if (scheduleItem.calendarGutter === calendarGutter) {
                                calendarGutter++;
                                collision = true;
                            }
                        }
                    });
                }
                scope.item.calendarGutter = calendarGutter;
                var beginningMinutesHeight = scope.item.beginning.minutes() * calendar.dayHeight / 60;
                var endMinutesHeight = scope.item.end.minutes() * calendar.dayHeight / 60;
                var top = (hours.startTime - calendar.startOfDay) * calendar.dayHeight + beginningMinutesHeight;
                scheduleItemEl.height(((hours.endTime - hours.startTime) * calendar.dayHeight - beginningMinutesHeight + endMinutesHeight) + 'px');
                scheduleItemEl.css({
                    top: top + 'px',
                    left: (scope.item.calendarGutter * (itemWidth * dayWidth / 100)) + 'px'
                });
                var container = element.find('container')
                if (top < 0) {
                    container.css({
                        top: (Math.abs(top) - 5) + 'px'
                    });
                    container.height(element.children('.schedule-item').height() + top + 5)
                }
                else {
                    container.css({
                        top: 0 + 'px'
                    });
                    container.css({ height: '100%' })
                }
            };
            scope.$parent.$watch('items', placeItem);
            scope.$parent.$watchCollection('items', placeItem);
            scope.$watch('item', placeItem);
            scope.placeItem = placeItem;
        }
    }
});