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
import {
    Calendar,
    CalendarOptions,
    DateSelectArg,
    EventChangeArg,
    EventClickArg,
    EventSourceInput,
    FullCalendarComponent
} from '@fullcalendar/angular';
import frLocale from '@fullcalendar/core/locales/fr';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment-es6';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap';
import {
    BehaviorSubject,
    Observable,
    Subject,
    Subscription } from 'rxjs';
import {
    distinctUntilChanged,
    first,
    skip,
    takeUntil
} from 'rxjs/operators';
import { durationBetweenTwoDatesInHours } from '../../helpers';
import { SmartTranslatePipe } from '../../pipes/smart-translate.pipe';
import { ICalendarEvent } from '../calendar-event.interface';

export type EventsGetter<T> = (start: Date, end: Date) => Observable<ICalendarEvent<T>[]>;

@Component({
    selector: 'daenae-basic-calendar',
    templateUrl: './basic-calendar.component.html',
    styleUrls: ['./basic-calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicCalendarComponent<T> implements OnInit, AfterViewInit, OnDestroy, OnChanges {

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
        day: 'CALENDAR.VIEW.DAY',
        week: 'CALENDAR.VIEW.WEEK',
        month: 'CALENDAR.VIEW.MONTH'
    };
    /**
     * Emitted when view dates interval is changed
     */
    @Output() public dateIntervalChange: Observable<{ start: Date, end: Date }>;
    /**
     * Emitted when one or more events are changed
     */
    @Output() public eventsChange = new EventEmitter<ICalendarEvent<T>[]>();
    /**
     * Emitted when one event is clicked
     */
    @Output() public eventClick = new EventEmitter<ICalendarEvent<T>>();
    /**
     * Emitted when dates are clicked (independant to displaied events)
     */
    @Output() public dateSelection = new EventEmitter<{ start: Date, end: Date }>();
    /**
     * Emitted when "new event" button clicked
     */
     @Output() public newClick = new EventEmitter<void>();

    @ViewChild(FullCalendarComponent) public calendar: FullCalendarComponent;

    public get calendarApi(): Calendar {
        return this.calendar.getApi();
    }

    public dateInterval$ = new BehaviorSubject({ start: null, end: null, endToDisplay: null });
    public currentView$ = new BehaviorSubject('timeGridWeek');
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

    constructor(
        private bootstrapLocale: BsLocaleService,
        private translate: TranslateService,
        cdr: ChangeDetectorRef
    ) {
        this.dateIntervalChange = this.dateInterval$.asObservable().pipe(
            skip(1),
            distinctUntilChanged()
        );
        this.datepickerForm = new FormControl(null);
        this.bootstrapLocale.use('fr');

        const translationPipe = new SmartTranslatePipe(translate, cdr);

        this.calendarOptions = {
            initialView: this.currentView$.getValue(),
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
            firstDay: 1,
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
            eventChange: this.eventChanged,
            // Make selectable
            selectable: true,
            select: this.dateSelected,
            // Set time config
            scrollTime: '07:00:00',
            height: 650,
            // slotMinTime: '07:00:00',
            // slotMaxTime: '17:00:00',
            // slotDuration: '00:30:00',
            // expandRows: true
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
                const arrayOfDomNodes = [ titleEl, brEl, timeEl, br2El, nameEl ];
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

    ngOnInit(): void {

        // Apply date from datepicker
        this.datepickerForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
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
        setTimeout(() => {
            this.updateDateInterval();
        }, 0);
        this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(e => {
            this.calendarApi.render();
        });
    }

    public next(): void {
        this.calendarApi.next();
        this.updateDateInterval();
    }

    public previous(): void {
        this.calendarApi.prev();
        this.updateDateInterval();
    }

    public jumpToToday(): void {
        this.calendarApi.today();
        this.updateDateInterval();
    }

    public changeView(view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'): void {
        this.calendarApi.changeView(view);
        this.currentView$.next(view);
        this.updateDateInterval();
    }

    public refreshEvents(): void {
        this.calendarApi.refetchEvents();
    }

    public createEvent(): void {
        this.newClick.next();
    }

    /**
     * Apply interval to observable (for html part) and datepicker
     */
    private updateDateInterval(): void {
        const calendar = this.calendarApi;
        this.dateInterval$.next({
            start: calendar.view.currentStart,
            end: calendar.view.currentEnd,
            endToDisplay: moment(calendar.view.currentEnd).subtract(1, 'day').toDate()
        });
        this.datepickerForm.setValue(calendar.getDate(), { emitEvent: false });
    }

    private changeDate(date: Date): void {
        this.calendarApi.gotoDate(date);
        this.updateDateInterval();
    }

    private eventClicked = (ev: EventClickArg): void => {
        this.eventClick.next(ev.event.extendedProps.baseObject);
    }

    private eventChanged = (ev: EventChangeArg): void => {
        this.eventsChange.next([{
            ...ev.event.extendedProps.baseObject,
            start: ev.event.start,
            end: ev.event.end
        }]);
    }

    private dateSelected = (ev: DateSelectArg): void => {
        this.dateSelection.next({
            start: ev.start,
            end: ev.end
        });
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
            () => error({ message: 'cannot load basic calendar events' })
        );
    }

}
