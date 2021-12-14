import { DurationInput } from '@fullcalendar/angular';

export interface ICalendarInternalEvent<T> {
    id: string;
    title: string;
    start: Date;
    end: Date;
    description: string;
    classNames?: string;
    display?: string;
    backgroundColor?: string;
    baseObject: T;
    isBlocking?: boolean;
    resourceId?: string;
    details?: string;
    duration?: DurationInput;
}

export interface ICalendarEvent<T> {
    toCalendarEvent: () => ICalendarInternalEvent<T>;
}
