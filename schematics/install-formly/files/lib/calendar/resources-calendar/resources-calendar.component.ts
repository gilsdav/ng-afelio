import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { EventsGetter, ICalendarEvent } from '@fcsd-daenae/form-components';
import {
    Calendar,
    CalendarOptions,
    DateSelectArg,
    EventClickArg,
    EventDropArg,
    EventSourceInput,
    FullCalendarComponent
} from '@fullcalendar/angular';
import frLocale from '@fullcalendar/core/locales/fr';
import { EventDragStopArg, EventReceiveArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment-es6';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, first, map, skip, takeUntil } from 'rxjs/operators';
import { capitalizeFirstLetter, durationBetweenTwoDatesInHours } from '../../helpers';
import { SmartTranslatePipe } from '../../pipes/smart-translate.pipe';

export interface CalendarResource {
    id: string;
    title: string;
}

export interface CalendarButton {
    callbackKey: string;
    label: string;
    classes: string[];
    icon?: string;
}

@Component({
    selector: 'daenae-resources-calendar',
    templateUrl: './resources-calendar.component.html',
    styleUrls: ['./resources-calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class ResourcesCalendarComponent<T> implements OnInit, OnDestroy, OnChanges, AfterViewInit {

    /**
     * The resources to use in the calendar.
     */
    @Input() public resources: CalendarResource[];

    /**
     * Event to display into the calendar.
     * Can be a getter function or directly an event array.
     */
    @Input() public calendarEvents: EventsGetter<T> | ICalendarEvent<T>[] = [];

    @Input() public calendarHolidays: ICalendarEvent<T>[] = [];

    /**
     * Observable that send event when events refresh is needed (will newly call the given getter into `calendarEvents`)
     */
    @Input() public refreshEventsObservable: Observable<any>;

    /**
     * You can have the hand to translation keys by using this input
     */
    @Input() public labels = {
        today: 'CALENDAR.TODAY',
        new: 'CALENDAR.NEW',
        day: 'CALENDAR.VIEW.DAY'
    };

    /**
     * The list of buttons to add in the header
     */
    @Input() public buttons: CalendarButton[] = [];

    /**
     * The external drop container inside wich the event leave can be dragged
     */
    @Input() public externalDropContainer: HTMLElement;

    /**
     * Emitted when view date is changed
     */
    @Output() public dateChanged: Observable<Date>;
    /**
     * Emitted when one or more events are changed
     */
    @Output() public eventChange = new EventEmitter<ICalendarEvent<T>>();

    /**
    * Emitted when one or more events are received from an external container
    */
    @Output() public eventReceive = new EventEmitter<ICalendarEvent<T>>();

    /**
    * Emitted when an event has been dragged on the externalDropContainer
    */
    @Output() public eventLeave = new EventEmitter<ICalendarEvent<T>>();

    /**
     * Emitted when one event is clicked
     */
    @Output() public eventClick = new EventEmitter<ICalendarEvent<T>>();

    /**
     * Emitted when dates are clicked (independant to displaied events)
     */
    @Output() public dateSelection = new EventEmitter<Date>();
    /**
     * Emitted when "new event" button clicked
     */
    @Output() public newClick = new EventEmitter<void>();

    /**
     * Emitted when a button is clicked
     */
    @Output() public buttonClick = new EventEmitter<string>();

    @ViewChild(FullCalendarComponent) public calendar: FullCalendarComponent;

    public currentDate$ = new BehaviorSubject<Date>(new Date());
    public currentDay$: Observable<string>;


    public datepickerForm: FormControl;

    public calendarOptions: CalendarOptions;

    public bsConfig: Partial<BsDatepickerConfig> = {
        containerClass: 'theme-grey',
        dateInputFormat: 'DD/MM/YYYY',
        showWeekNumbers: false,
        customTodayClass: 'today'
    };

    private destroy$ = new Subject();
    private previousEventFetch: Subscription;

    public get calendarApi(): Calendar {
        return this.calendar.getApi();
    }

    constructor(
        private bootstrapLocale: BsLocaleService,
        private translate: TranslateService,
        private cdr: ChangeDetectorRef
    ) {

        this.dateChanged = this.currentDate$.asObservable().pipe(
            skip(1),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        );

        this.currentDay$ = this.currentDate$.pipe(
            map((date: Date) => capitalizeFirstLetter(moment(date).format('dddd DD MMMM YYYY'))),
            takeUntil(this.destroy$)
        );
        this.datepickerForm = new FormControl(null);
        this.bootstrapLocale.use('fr');

    }

    ngOnInit() {
        this.setCalendarOptions(new SmartTranslatePipe(this.translate, this.cdr));
        // Apply date from datepicker
        this.datepickerForm.valueChanges
            .pipe(takeUntil(this.destroy$)).subscribe(value => {
                this.changeDate(value);
            });
        // Apply refresh from outside
        if (this.refreshEventsObservable) {
            this.refreshEventsObservable.pipe(
                takeUntil(this.destroy$)
            ).subscribe(() => {
                this.refreshEvents();
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.calendarEvents?.currentValue && !changes.calendarEvents.firstChange) {
            this.refreshEventsSource();
        }
        if (changes.resources?.currentValue && !changes.resources.firstChange) {
            this.refreshResources();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.eventClick.complete();
        this.newClick.complete();
    }

    ngAfterViewInit(): void {
        // Apply event source
        this.refreshEventsSource();
        this.refreshResources();
        setTimeout(() => {
            this.updateDateFromCalendar();
        }, 0);
        this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(e => {
            this.calendarApi.render();
        });
    }

    public refreshEvents(): void {
        this.calendarApi.refetchEvents();
    }

    public next(): void {
        this.calendarApi.next();
        this.updateDateFromCalendar();
    }

    public previous(): void {
        this.calendarApi.prev();
        this.updateDateFromCalendar();
    }

    public jumpToToday(): void {
        this.calendarApi.today();
        this.updateDateFromCalendar();
    }

    private updateDateFromCalendar() {
        const calendarDate = this.calendarApi.getDate();
        this.currentDate$.next(calendarDate);
        this.datepickerForm.setValue(calendarDate, { emitEvent: false });
    }

    private changeDate(date: Date): void {
        this.calendarApi.gotoDate(date);
        this.updateDateFromCalendar();
    }

    private refreshEventsSource() {
        this.calendarApi.removeAllEventSources();
        if (typeof this.calendarEvents === 'function') {
            this.calendarApi.addEventSource(this.fetchEvents);
        } else if (this.calendarEvents.length > 0) {
            this.calendarApi.addEventSource(this.calendarEvents.map(e => e.toCalendarEvent()));
        }
        if (this.calendarHolidays.length > 0) {
            this.calendarApi.addEventSource(this.calendarHolidays.map(e => e.toCalendarEvent()));
        }
    }

    private refreshResources() {
        this.calendarApi.getResources().forEach(value => {
            value.remove();
        });
        this.resources.forEach(res => {
            this.calendarApi.addResource(res);
        });

        this.refreshEventsSource();
    }

    /**
     * Only used `calendarEvents` is a `EventsGetter`
     */
    private fetchEvents: EventSourceInput = (args, success, error): void => {
        if (this.previousEventFetch && !this.previousEventFetch.closed) {
            this.previousEventFetch.unsubscribe();
        }
        const eventsGetter = this.calendarEvents as EventsGetter<T>;
        this.previousEventFetch = eventsGetter(args.start, args.end).pipe(
            first(),
            takeUntil(this.destroy$)
        ).subscribe(
            events => {
                return success(events.map(e => e.toCalendarEvent()));
            },
            () => error({ message: 'cannot load ressources calendar events' })
        );
    }

    private eventClicked = (ev: EventClickArg): void => {
        this.eventClick.next(ev.event.extendedProps.baseObject);
    }

    private eventDroppedResource = (ev: EventDropArg): void => {
        let eventToEmit = {
            ...ev.event.extendedProps.baseObject,
            start: ev.event.start,
            end: ev.event.end
        };
        if (ev.newResource?.id !== ev.oldResource?.id) {
            eventToEmit = {
                ...eventToEmit,
                resourceId: ev.newResource.id
            };
        }
        this.eventChange.next(eventToEmit);
    }

    private eventResized = (ev: EventResizeDoneArg): void => {
        this.eventChange.next({
            ...ev.event.extendedProps.baseObject,
            start: ev.event.start,
            end: ev.event.end
        });
    }

    private eventReceived = (ev: EventReceiveArg): void => {
        this.eventReceive.next({
            ...ev.event.extendedProps.baseObject,
            start: ev.event.start,
            end: ev.event.end,
            resourceId: ev.event.getResources()[0].id
        });

        ev.revert(); // To avoid a duplication when the webservice call is done.
    }

    private eventDragStop = (e: EventDragStopArg) => {
        const rect = this.externalDropContainer.getBoundingClientRect();
        const x1 = rect.left;
        const x2 = rect.right;
        const y1 = rect.top;
        const y2 = rect.bottom;

        if (e.jsEvent.pageX >= x1 && e.jsEvent.pageX <= x2 &&
            e.jsEvent.pageY >= y1 && e.jsEvent.pageY <= y2) {
            e.event.remove();
            this.eventLeave.next({
                ...e.event.extendedProps.baseObject,
                start: e.event.start,
                end: e.event.end,
                resourceId: null
            });
        }
    }

    private dateSelected = (ev: DateSelectArg): void => {
        this.dateSelection.next(ev.start);
    }


    private setCalendarOptions(translationPipe: SmartTranslatePipe) {
        this.calendarOptions = {
            initialView: 'resourceTimeGridDay',
            selectOverlap: true,
            // Clear (hide) header
            headerToolbar: {
                left: '',
                center: '',
                right: ''
            },
            // Init FR local
            locales: [frLocale],
            locale: 'fr',
            // Some additional features
            nowIndicator: true,
            allDaySlot: false,
            dayCellClassNames: (arg) => {
                // Highlight weekend days
                const dayOfWeek = arg.date.getDay();
                const isWeekend = (dayOfWeek === 6) || (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
                if (isWeekend) {
                    return ['weekend'];
                } else {
                    return [];
                }
            },
            // Make clickable
            eventClick: this.eventClicked,
            // Make editable
            editable: true,
            eventDrop: this.eventDroppedResource,
            eventResize: this.eventResized,
            eventResourceEditable: true,
            // Make selectable
            selectable: true,
            select: this.dateSelected,
            // Set time config
            scrollTime: '07:00:00',
            slotDuration: '00:15:00',
            slotLabelInterval: '01:00:00',
            height: 650,
            droppable: true,
            eventReceive: this.eventReceived,
            dragRevertDuration: 0,
            eventDragStop: this.eventDragStop,
            eventContent: (arg) => {
                const titleEl = document.createElement('strong');
                titleEl.innerText = translationPipe.transform(arg.event.title);
                const timeEl = document.createElement('time');
                const duration = `(${durationBetweenTwoDatesInHours(arg.event.start, arg.event.end)})`;
                timeEl.innerText = arg.event.display !== 'background' ? `${moment(arg.event.start).format('HH:mm')} - ${moment(arg.event.end).format('HH:mm')} ${duration}` : '';
                const brEl = document.createElement('br');
                const br2El = document.createElement('br');
                const nameEl = document.createElement('span');
                nameEl.innerText = arg.event.extendedProps?.baseObject?.description ?? '';

                const detailsEl = document.createElement('span');
                detailsEl.innerText = arg.event.extendedProps?.baseObject?.details ?? '';
                const arrayOfDomNodes = [titleEl, brEl, timeEl, br2El, nameEl, detailsEl];
                return { domNodes: arrayOfDomNodes };
            },
            dayHeaderContent: (arg) => {
                return arg.text.split('/')[0];
            },
            slotLabelContent: (arg) => {
                return arg.text.split(' ')[0] + ':00';
            }
        };
    }

}
