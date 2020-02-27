import { model } from './entcore';
import { Eventer } from 'entcore-toolkit';

var moment = require('moment');
var _ = require('underscore');

export interface Timeslot {
	start: number;
	startMinutes: number;
	end: number;
	endMinutes: number;
	name: string;
	displayTime: string;
}

export var calendar = {
	slotsDuration: [],
    setCalendar: function(cal){
        model.calendar = cal;
    },
	getHours: function(scheduleItem, day){
		var startTime = calendar.startOfDay;
		var endTime = calendar.endOfDay;

		if(scheduleItem.beginning.dayOfYear() === day.index){
			startTime = scheduleItem.beginning.hours();
		}

		if(scheduleItem.end.dayOfYear() === day.index){
			endTime = scheduleItem.end.hours();
		}

		return {
			startTime: startTime,
			endTime: endTime
		}
	},
	TimeSlot: function(data){
	},
	ScheduleItem: function(){

	},
	Day: function(data){
		var day = this;
		this.collection(calendar.ScheduleItem, {
			beforeCalendar: function(){
				return this.filter(function(scheduleItem){
					return scheduleItem.beginning.hour() < calendar.startOfDay;
				}).length;
			},
			afterCalendar: function(){
				return this.filter(function(scheduleItem){
					return scheduleItem.end.hour() > calendar.endOfDay;
				}).length;
			},
			scheduleItemWidth: function(scheduleItem){
				var concurrentItems = this.filter(function(item){
					return item.beginning.unix() < scheduleItem.end.unix() && item.end.unix() > scheduleItem.beginning.unix()
				});
				var maxGutter = 0
				_.forEach(concurrentItems, function(item){
					if(item.calendarGutter && item.calendarGutter > maxGutter){
						maxGutter = item.calendarGutter
					}
				});
				maxGutter++;
				return Math.floor(99 / maxGutter);
			}
		});
		this.collection(calendar.TimeSlot);
		this.timeSlots.load(calendar.getTimeslots());
	},
	Calendar: function(data){
	    this.eventer = new Eventer();
		if(!data.year){
			data.year = moment().year();
		}
        this.increment = 'week';
        this.firstDay = moment().year(data.year).week(data.week).day(1);

	    // change of year in moment is buggy (last/first week is on the wrong year)
        // weird syntax is a workaround
        // this.dayForWeek = moment(
        //     this.year +
        //     "-W" + (this.week < 10 ? "0" + this.week : this.week) +
        //     "-1")

		var that = this;

		this.collection(calendar.Day, {
			sync: function(){
                var fd = moment(that.firstDay);
                var days = [];

                var cur = moment(fd).lang('en');

                while (
                    cur.isSame(fd.clone().startOf('day'), 'day') ||
                    (
                        cur.isAfter(fd.clone().startOf(that.increment)) &&
                        cur.isBefore(fd.clone().endOf(that.increment))
                    )
                    ) {
                    days.push({
                        name: cur.format('dddd').toLowerCase(),
                        date: cur.clone(),
                        index: cur.dayOfYear(),
                    });
                    cur.add(1, 'day');
			}
                that.days.load(days);
            },
		});

		this.days.sync();

		this.collection(calendar.TimeSlot);
		this.timeSlots.load(calendar.getTimeslots());
		this.processSlotsDuration();
	},
	viewTimeRange: 13,
	firstHour: 0,
	lastHour: 24,
	startOfDay: 7,
	startOfDayMinutes: 0,
	endOfDay: 20,
	dayHeight: 40,
	customSlots: undefined,
	getTimeslots: function (): Timeslot[] {
		const slots = [];
		if (!calendar.customSlots) {
			calendar.firstHour = 0;
			calendar.lastHour = 24;
			for(let i = calendar.startOfDay; i < calendar.endOfDay; i++){
				let name = `${i}h00 - ${i+1}h00`;
				slots.push(new calendar.TimeSlot({ start: i, end: i+1, startMinutes: 0, endMinutes: 0, name, displayTime: name }));
			}
		} else {
			if (calendar.customSlots.length === 0) return slots;
			const startIndex = getFirstSlotIndex(calendar.customSlots);
			const endIndex = startIndex + calendar.viewTimeRange > calendar.customSlots.length ? calendar.customSlots.length : startIndex + calendar.viewTimeRange;
			calendar.firstHour = parseInt(calendar.customSlots[0].startHour.split(':')[0]);
			calendar.lastHour = parseInt(calendar.customSlots[calendar.customSlots.length - 1].endHour.split(':')[0]);
			for (let i = startIndex; i < endIndex; i++) {
				let start = calendar.customSlots[i].startHour.split(':')[0];
				let startMinutes = calendar.customSlots[i].startHour.split(':')[1];
				let end = calendar.customSlots[i].endHour.split(':')[0];
				let endMinutes = calendar.customSlots[i].endHour.split(':')[1];
				let displayTime = `${start}h${startMinutes} - ${end}h${endMinutes}`;
				let slot = {
					name: calendar.customSlots[i].name,
					start: parseInt(start),
					startMinutes: parseInt(startMinutes),
					end: parseInt(end),
					endMinutes: parseInt(endMinutes),
					displayTime
				};
				slots.push(new calendar.TimeSlot(slot));
			}
		}
		return slots;
	},
	init: function(){
		model.makeModels(calendar);
		model.calendar = new calendar.Calendar({ week: moment().week() });
	}
};

function getFirstSlotIndex (slots) {
	for (let i = 0; i < slots.length; i++) {
		let slotStartHour = parseInt(slots[i].startHour.split(':')[0]);
		if (slotStartHour === calendar.startOfDay) {
			return i;
		}
	}

	return null;
}

calendar.Calendar.prototype.getFirstSlotIndex = function () {
	for (let i = 0; i < this.timeSlots.all.length; i++) {
		let timeSlot = this.timeSlots.all[i];
		if (timeSlot.start === calendar.startOfDay && timeSlot.startMinutes === calendar.startOfDayMinutes) {
			return i;
		}
	}

	return null;
};

calendar.Calendar.prototype.initTimeSlots = function(){
    this.collection(calendar.TimeSlot);
	this.timeSlots.load(calendar.getTimeslots());
};
calendar.Calendar.prototype.addScheduleItems = function(items){
    var schedule = this;
    items
        .filter(function(item) {
            return moment(item.end).isSame(schedule.firstDay, schedule.increment);
        })
        .forEach(function(item) {
		var startDay = moment(item.beginning);
		var endDay = moment(item.end);

		var refDay = moment(schedule.firstDay)
		schedule.days.forEach(function(day){
			if(startDay.isBefore(moment(refDay).endOf('day')) && endDay.isAfter(moment(refDay).startOf('day')))
				day.scheduleItems.push(item);
			refDay.add('day', 1);
		});
	});
};

calendar.Calendar.prototype.setIncrement = function(incr) {
    if (['day', 'week', 'month'].indexOf(incr) === -1) {
        throw new Error(
            "Invalid argument: increment must be 'day', 'week' or 'month'"
        );
    }

    this.increment = incr;
    this.setDate(this.firstDay);

    return this.firstDay;
};

calendar.Calendar.prototype.processSlotsDuration = function () {
	const slotsDuration = [];
	const slots = calendar.getTimeslots();
	slots.forEach(({start, startMinutes, end, endMinutes}) => {
		let momentStart = moment().hour(start).minute(startMinutes).second(0);
		let momentEnd = moment().hour(end).minute(endMinutes).second(0);
		slotsDuration.push(momentEnd.diff(momentStart, 'minute'));
	});
	calendar.slotsDuration = slotsDuration;
};

calendar.Calendar.prototype.getSlotsIndex = function (beginning, end): Array<number> {
	const indexes = [];
	beginning = moment(beginning);
	end = moment(end);
	for (let i = 0; i < this.timeSlots.all.length; i++) {
		let slot = this.timeSlots.all[i];
		let slotStart = beginning.clone().hour(slot.start).minute(slot.startMinutes).seconds(0);
		let slotEnd = end.clone().hour(slot.end).minute(slot.endMinutes).seconds(0);

		/**
		 * An item is NOT considered in a time slot when :
		 * 		case 1: its end < slot start date
		 * 		case 2:	its start > slot end date
		 */

		const case1 = end.isSameOrBefore(slotStart);
		const case2 = beginning.isSameOrAfter(slotEnd);

		if (!(case1 || case2)) {
			indexes.push(i);
		}
	}

	return indexes;
};

calendar.Calendar.prototype.setTimeslots = function (slots) {
	calendar.customSlots = slots;
	this.setStartAndEndOfDay(slots);
	this.days.sync();
	this.timeSlots.load(calendar.getTimeslots());
	this.processSlotsDuration();
};

calendar.Calendar.prototype.setStartAndEndOfDay = function (slots) {
	if (slots) {
		calendar.startOfDay = parseInt(slots[0].startHour.split(':')[0]);
		calendar.startOfDayMinutes = parseInt(slots[0].startHour.split(':')[1]);
		const lastSlot = slots.length > calendar.viewTimeRange ? slots[calendar.viewTimeRange - 1] : slots[slots.length - 1];
		calendar.endOfDay = parseInt(lastSlot.startHour.split(':')[0]);
	} else {
		calendar.startOfDay = 7;
		calendar.startOfDayMinutes = 0;
		calendar.endOfDay = calendar.startOfDay + calendar.viewTimeRange;
	}
};

calendar.Calendar.prototype.setDate = function(momentDate){
    this.firstDay = moment(momentDate).startOf(this.increment);
	this.days.sync();
	this.trigger('date-change');
};
calendar.Calendar.prototype.next = function() {
    // pluralize to match MomentJS API
    var incr = this.increment + 's';

    var newDate = moment(this.firstDay).add(1,   incr);
    this.setDate(newDate);
    return newDate;
};

calendar.Calendar.prototype.previous = function() {
    // pluralize to match MomentJS API
    var incr = this.increment + 's';

    var newDate = moment(this.firstDay).subtract(1, incr);
    this.setDate(newDate);
    return newDate;
};

calendar.Calendar.prototype.clearScheduleItems = function(){
	this.days.forEach(function(day){
		day.scheduleItems.removeAll();
	});
};
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.calendar = calendar;