import { ChangeDetectionStrategy, Component, forwardRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DS_LabelWithParam } from '../interfaces/public-api';
/**
 * Doc on the checkbox component
 */
@Component({
    selector: 'ds-checkbox',
    templateUrl: './checkbox.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DS_CheckboxComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DS_CheckboxComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

    /**
     * Checkbox label
     *
     */
    @Input()
    public label?: DS_LabelWithParam;

    /**
     * Checkbox id
     *
     * @required
     */
    @Input()
    public id!: string;

    /**
     * Checkbox is disabled
     */
    @Input()
    public isDisabled?: boolean;

    /**
     * Checkbox take full width
     */
    @Input()
    public isFullWidth = true;

    /**
     * Checkbox is invalid
     */
    @Input()
    public isOnError = false;

    /**
     * Checkbox custom HTML classes
     *
     */
    @Input()
    public customClasses: string[] = [];

    classes$ = new BehaviorSubject<string[]>(['']);

    control = new FormControl();
    destroyer$ = new Subject();

    constructor() {}

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

        if (!!this.isDisabled) {
            classes.push('-disabled');
        }

        if (!this.isFullWidth) {
            classes.push('-auto');
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
