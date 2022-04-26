import { ChangeDetectionStrategy, Component, Input, forwardRef, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LabelWithParam } from '../interfaces/public-api';

@Component({
  selector: 'ds-textarea',
  templateUrl: './textarea.component.html',
  providers: [
    {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => TextareaComponent),
        multi: true
    }
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  /**
   * Textarea placeholder
   *
   */
  @Input()
  public placeholder?: LabelWithParam;

  /**
   * Textarea is disabled
   */
  @Input()
  public isDisabled = false;

  /**
   * Textarea value maximum length
   */
  @Input()
  public maxlength?: string;

  /**
   * Textarea is invalid
   */
  @Input()
  public isOnError = false;

  /**
   * Textarea custom HTML classes
   *
   */
  @Input()
  public customClasses: string[] = [];

  classes$ = new BehaviorSubject<string[]>(['']);
  public valueSize$ = new BehaviorSubject(0);

  public control: FormControl;
  public destroyer$: Subject<any>;

  constructor() {
    this.control = new FormControl();
    this.destroyer$ = new Subject();
  }

  public ngOnInit(): void {
    this.control.valueChanges.pipe(
      takeUntil(this.destroyer$)
    ).subscribe({
      next: (value) => {
        this.valueSize$.next((value) ? value.length : 0);
        this.onChange(value);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.classes$.next(this.getClasses());
    if (changes && changes['isDisabled']) {
      this.isDisabled ? this.control.disable() : this.control.enable();
    }
  }

  public ngOnDestroy(): void {
    this.valueSize$.complete();
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

  public onChange = (data: string) => {}

  public onTouched = () => {}

  // ---------- ControlValueAccessor IMPLEMENTATION ----------

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
