export declare var calendar: {
    setCalendar: (cal: any) => void;
    getHours: (scheduleItem: any, day: any) => {
        startTime: number;
        endTime: number;
    };
    TimeSlot: (data: any) => void;
    ScheduleItem: () => void;
    Day: (data: any) => void;
    Calendar: (data: any) => void;
    startOfDay: number;
    endOfDay: number;
    dayHeight: number;
    init: () => void;
};
