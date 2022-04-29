import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  forwardRef,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DS_LabelWithParam } from '../interfaces/public-api';
import { DS_Textfield_type_Enum, DS_icon_placement_Enum, DS_IconsEnum } from '../enums/public-api';

/**
 * Doc on the textfield
 */
@Component({
  selector: 'ds-textfield',
  templateUrl: './textfield.component.html',
  providers: [
    {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => DS_TextfieldComponent),
        multi: true
    }
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DS_TextfieldComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  /**
   * Textfield placeholder
   *
   */
  @Input()
  public placeholder?: DS_LabelWithParam;

  /**
   * Textfield is disabled
   */
  @Input()
  public isDisabled = false;

  /**
   * Textfield type (number, text, submit…)
   */
  @Input()
  public type = DS_Textfield_type_Enum.text;

  /**
   * Does the icon before or after the label ?
   */
  @Input()
  public iconPlacement: DS_icon_placement_Enum = DS_icon_placement_Enum.before;

  /**
   * What icon do you want to show ?
   */
  @Input()
  public icon?: DS_IconsEnum;

  /**
   * Textfield is invalid
   */
  @Input()
  public isOnError = false;

  /**
   * Textfield custom HTML classes
   *
   */
  @Input()
  public customClasses: string[] = [];

  classes$ = new BehaviorSubject<string[]>(['']);
  iconClasses$ = new BehaviorSubject<string[]>(['']);

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
        this.onChange(value);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.classes$.next(this.getClasses());
    this.iconClasses$.next(this.getIconClass());
    if (changes && changes['isDisabled']) {
      this.isDisabled ? this.control.disable() : this.control.enable();
    }
  }

  public ngOnDestroy(): void {
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

    if (!!this.iconPlacement) {
      classes.push(this.iconPlacement.toString());
    }

    if (this.customClasses && this.customClasses.length > 0) {
      classes.push(...this.customClasses);
    }

    return classes;
  }

  getIconClass(): string[] {
    const iconClass: string[] = [];

    if (!!this.icon) {
      iconClass.push(this.icon.toString());
    }

    return iconClass;
  }

  public onChange = (data: string) => {};
  public onTouched = () => {};

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
