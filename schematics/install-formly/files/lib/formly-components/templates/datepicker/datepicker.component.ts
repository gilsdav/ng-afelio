import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

/**
 * TemplateOptions
 * - minDate: Date
 * - maxDate: Date
 */
@Component({
  selector: 'daenae-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DatepickerComponent extends FieldType {
}
