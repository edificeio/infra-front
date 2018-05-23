import { model } from './entcore';
import { Eventer } from 'entcore-toolkit';

var moment = require('moment');
var _ = require('underscore');

export var calendar = {
    setCalendar: function(cal){
        model.calendar = cal;
    },
	getHours: function(scheduleItem, day){
		var startTime = 7;
		var endTime = 20;

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
		for(var i = calendar.startOfDay; i < calendar.endOfDay; i++){
			this.timeSlots.push(new calendar.TimeSlot({ start: i, end: i+1 }))
		}
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
		for(var i = calendar.startOfDay; i < calendar.endOfDay; i++){
			this.timeSlots.push(new calendar.TimeSlot({ beginning: i, end: i+1 }))
		}
	},
	startOfDay: 7,
	endOfDay: 20,
	dayHeight: 40,
	init: function(){
		model.makeModels(calendar);
		model.calendar = new calendar.Calendar({ week: moment().week() });
	}
};
calendar.Calendar.prototype.initTimeSlots = function(){
    this.collection(calendar.TimeSlot);
    for(var i = calendar.startOfDay; i < calendar.endOfDay; i++){
        this.timeSlots.push(new calendar.TimeSlot({ beginning: i, end: i+1 }))
    }
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