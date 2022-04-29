import { ChangeDetectionStrategy, Component, forwardRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DS_LabelWithParam } from '../interfaces/public-api';
/**
 * Doc on the radio
 */
@Component({
  selector: 'ds-radio',
  templateUrl: './radio.component.html',
  providers: [
    {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => DS_RadioComponent),
        multi: true
    }
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DS_RadioComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  /**
   * Radio label
   *
   */
  @Input()
  public label?: DS_LabelWithParam;

  /**
   * Radio id
   *
   * @required
   */
  @Input()
  public id!: string;

  /**
   * Radio name
   *
   * @required
   */
  @Input()
  public name!: string;

  /**
   * Radio value
   *
   * @required
   */
  @Input()
  public value: any;

  /**
   * Radio is disabled
   */
  @Input()
  public isDisabled?: boolean;

  /**
   * Checkbox is invalid
   */
  @Input()
  public isOnError = false;

  
  /**
   * Radio custom HTML classes
   */
  @Input()
  public customClasses: string[] = [];

  classes$ = new BehaviorSubject<string[]>(['']);

  control = new FormControl();
  destroyer$ = new Subject();

  constructor() { }

  ngOnInit(): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroyer$)
    ).subscribe(value => {
      this.onChange(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.classes$.next(this.getClasses());
    if (changes && changes['isDisabled']) {
      this.isDisabled ? this.control.disable() : this.control.enable();
    }
  }

  ngOnDestroy(): void {
    this.destroyer$.next(null);
    this.destroyer$.complete();
  }

  getClasses(): string[] {
    const classes: string[] = [];

    if (this.isDisabled) {
      classes.push('-disabled');
    }

    if (this.isOnError) {
      classes.push('-error');
    }

    if (this.customClasses && this.customClasses.length > 0) {
      classes.push(...this.customClasses);
    }

    return classes;
  }

  // ---------- ControlValueAccessor IMPLEMENTATION ----------

  public onChange = (data: string) => { };
  public onTouched = () => { };

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public writeValue(value: string): void {
    this.control.setValue(value, {
      emitEvent: false
    });
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
    this.isDisabled = isDisabled;
  }
}   