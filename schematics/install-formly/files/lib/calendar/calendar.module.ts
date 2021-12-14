import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { TranslateModule } from '@ngx-translate/core';
import { BsDatepickerModule } from 'ngx-bootstrap';
import { BasicCalendarComponent } from './basic-calendar/basic-calendar.component';
import { ResourcesCalendarComponent } from './resources-calendar/resources-calendar.component';


FullCalendarModule.registerPlugins([
    dayGridPlugin,
    interactionPlugin,
    timeGridPlugin,
    resourceTimeGridPlugin
]);

@NgModule({
    imports: [
        CommonModule,
        FullCalendarModule,
        BsDatepickerModule.forRoot(),
        ReactiveFormsModule,
        TranslateModule
    ],
    declarations: [BasicCalendarComponent, ResourcesCalendarComponent],
    exports: [BasicCalendarComponent, ResourcesCalendarComponent]
})
export class CalendarModule { }
