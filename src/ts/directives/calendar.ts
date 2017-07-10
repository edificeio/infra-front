import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { model } from '../modelDefinitions';
import { moment } from '../libs/moment/moment';
import { _ } from '../libs/underscore/underscore';
import { calendar } from '../calendar';
import { template } from '../template';
import { $ } from '../libs/jquery/jquery';

export let calendarComponent = ng.directive('calendar', function () {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: '/' + appPrefix + '/public/template/entcore/calendar.html',
        controller: function ($scope, $timeout) {
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

                $scope.editItem = function (item) {
                    $scope.calendarEditItem = item;
                    $scope.display.editItem = true;
                };

                $scope.createItem = function (day, timeslot) {
                    $scope.newItem = {};
                    var year = model.calendar.year;
                    if (day.index < model.calendar.firstDay.dayOfYear()) {
                        year++;
                    }
                    $scope.newItem.beginning = moment().utc().year(year).dayOfYear(day.index).hour(timeslot.start);
                    $scope.newItem.end = moment().utc().year(year).dayOfYear(day.index).hour(timeslot.end);
                    model.calendar.newItem = $scope.newItem;
                    $scope.onCreateOpen();
                };

                $scope.closeCreateWindow = function () {
                    $scope.display.createItem = false;
                    $scope.onCreateClose();
                };

                $scope.updateCalendarWeek = function () {
                    //annoying new year workaround
                    if (moment(model.calendar.dayForWeek).week() === 1 && moment(model.calendar.dayForWeek).dayOfYear() > 7) {
                        model.calendar = new calendar.Calendar({ week: moment(model.calendar.dayForWeek).week(), year: moment(model.calendar.dayForWeek).year() + 1 });
                    }
                    else if (moment(model.calendar.dayForWeek).week() === 53 && moment(model.calendar.dayForWeek).dayOfYear() < 7) {
                        model.calendar = new calendar.Calendar({ week: moment(model.calendar.dayForWeek).week(), year: moment(model.calendar.dayForWeek).year() - 1 });
                    } else {
                        model.calendar = new calendar.Calendar({ week: moment(model.calendar.dayForWeek).week(), year: moment(model.calendar.dayForWeek).year() });
                    }
                    model.trigger('calendar.date-change');
                    refreshCalendar();
                };

                $scope.previousTimeslots = function () {
                    calendar.startOfDay--;
                    calendar.endOfDay--;
                    model.calendar = new calendar.Calendar({ week: moment(model.calendar.dayForWeek).week(), year: moment(model.calendar.dayForWeek).year() });
                    refreshCalendar();
                };

                $scope.nextTimeslots = function () {
                    calendar.startOfDay++;
                    calendar.endOfDay++;
                    model.calendar = new calendar.Calendar({ week: moment(model.calendar.dayForWeek).week(), year: moment(model.calendar.dayForWeek).year() });
                    refreshCalendar();
                };
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
        },
        link: function (scope, element, attributes) {
            var allowCreate;
            scope.display = {};
            attributes.$observe('createTemplate', function () {
                if (attributes.createTemplate) {
                    template.open('schedule-create-template', attributes.createTemplate);
                    allowCreate = true;
                }
                if (attributes.displayTemplate) {
                    template.open('schedule-display-template', attributes.displayTemplate);
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
        controller: function ($scope) {

        },
        link: function (scope, element, attributes) {
            var parentSchedule = element.parents('.schedule');
            var scheduleItemEl = element.children('.schedule-item');
            var dayWidth = parentSchedule.find('.day').width();
            if (scope.item.beginning.dayOfYear() !== scope.item.end.dayOfYear() || scope.item.locked) {
                scheduleItemEl.removeAttr('resizable');
                scheduleItemEl.removeAttr('draggable');
                scheduleItemEl.unbind('mouseover');
                scheduleItemEl.unbind('click');
                scheduleItemEl.data('lock', true)
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

                startTime.year(model.calendar.year);
                endTime.year(model.calendar.year);

                var days = element.parents('.schedule').find('.day');
                var center = scheduleItemEl.offset().left + scheduleItemEl.width() / 2;
                var dayWidth = days.first().width();
                days.each(function (index, item) {
                    var itemLeft = $(item).offset().left;
                    if (itemLeft < center && itemLeft + dayWidth > center) {
                        var day = index + 1;
                        var week = model.calendar.week;
                        endTime.week(week);
                        startTime.week(week);
                        if (day === 7) {
                            day = 0;
                            endTime.week(week + 1);
                            startTime.week(week + 1);
                        }
                        endTime.day(day);
                        startTime.day(day);
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