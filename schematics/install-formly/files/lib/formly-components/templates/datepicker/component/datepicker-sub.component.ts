import { Component, OnInit, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import moment from 'moment-es6';
import { stringToMoment } from '../../../validators/date-validator-helper';
@Component({
  selector: 'daenae-sub-datepicker',
  templateUrl: './datepicker-sub.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerSubComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatepickerSubComponent),
      multi: true
    }
  ]
})
export class DatepickerSubComponent implements OnInit, ControlValueAccessor, Validator {
  private readonly defaultMinDate = new Date ('01/01/1900');
  private readonly defaultMaxDate = new Date ('01/01/2200');

  @Input() disabled = false;
  @Input() placeholder: string;
  @Input() dateFormat = 'DD/MM/YYYY';
  @Input() set minDate(value: Date) {
    this.bsConfig.minDate = value;
  } get minDate(): Date {
    return this.bsConfig.minDate;
  }
  @Input() set maxDate(value: Date) {
    this.bsConfig.maxDate = value;
  } get maxDate(): Date {
    return this.bsConfig.maxDate;
  }
  @Input() id: string;

  public inputValue: string;
  public datepickerValue: Date;
  public dateNow: Date;

  public bsConfig: Partial<BsDatepickerConfig> = {
    containerClass: 'theme-grey',
    dateInputFormat: this.dateFormat,
    showWeekNumbers: false,
  };
  private _onChange = (myValue: string) => {
    this._onTouched();
  }
  private _onTouched = () => { };

  constructor(private bootstrapLocale: BsLocaleService) {
    this.bootstrapLocale.use('fr');
    this.dateNow = new Date();
  }

  ngOnInit() {

    if (!this.bsConfig.minDate) {
        this.minDate = this.defaultMinDate;
    }

    if (!this.bsConfig.maxDate) {
        this.maxDate = this.defaultMaxDate;
    }

  }

  //#region "ControlValueAccessor"
  writeValue(obj: string): void {
    if (!obj) {
      this.inputValue = undefined;
      this.datepickerValue = undefined;
      this._onChange(undefined);
      return;
    }
    const date = moment(obj, this.dateFormat);
    if (date.isValid()) {
      this.inputValue = date.format(this.dateFormat);
      this.datepickerValue = date.toDate();
    }
    this._onChange(obj);
  }
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  //#endregion "ControlValueAccessor"

  onInputChange(value: string) {
    if (!value) {
      this.writeValue(undefined);
      return;
    }
    const date = moment(value, this.dateFormat, true);


    if (date.isValid()) {
      this.writeValue(date.format(this.dateFormat));
    } else {
      this._onChange(value);
    }
  }

  onDatepickerChange(value: Date) {
    const date = moment(value, this.dateFormat, true);
    if (date.isValid()) {
      this.writeValue(date.format(this.dateFormat));
    }
  }

  onBlur() {
    this._onTouched();
  }

  validate(control: AbstractControl): ValidationErrors {
    const value = control.value;
    if (value) {
      const currentMomentDate = stringToMoment(value).startOf('day');
      if (!currentMomentDate.isValid()) {
        return { invalidDate: true };
      }

      if (this.maxDate && moment(this.maxDate, 'DD/MM/YYYY', true).startOf('day').isBefore(currentMomentDate)) {
        return { dateTooBig: this.maxDate };
      }
      if (this.minDate && moment(this.minDate, 'DD/MM/YYYY', true).startOf('day').isAfter(currentMomentDate)) {
        return { dateTooSmall: this.minDate };
      }
    }
  }
}
