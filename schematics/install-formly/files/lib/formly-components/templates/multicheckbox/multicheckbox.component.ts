import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
export interface MultiCheckboxFormlyFieldInterface {
    fields: FormlyFieldConfig[];
    model?: any;
    formState?: any;
}
export interface MultiCheckboxValueInterface {
    key: string;
    label: string;
    fieldsWhenTrue?: MultiCheckboxFormlyFieldInterface;
}
@Component({
    selector: 'daenae-checkbox',
    templateUrl: './multicheckbox.component.html'
})
export class MulticheckboxComponent extends FieldType implements OnInit, OnDestroy, DoCheck {

    private destroy$: Subject<boolean> = new Subject<boolean>();
    public checkboxes$: Observable<any>;
    public formCheckbox: FormGroup;
    // public checkboxes: { [key: string]: FormControl };

    public numberOfSelected: number;
    public checkboxLength: number;
    public formCheckboxSubscription: Subscription;
    public formControlSubscription: Subscription;

    constructor() {
        super();
        this.formCheckbox = new FormGroup({});
        this.checkboxLength = 0;
    }


    ngOnInit(): void {
        this.checkboxes$ = this.getOptionsAsObservabe().pipe(takeUntil(this.destroy$));
        this.checkboxes$.subscribe((values) => {
            this.detachEvent();
            this.updateForm(values);
            this.updateValues();
            this.attachEvent();
            this.refreshNumberOfSelected();
        });
    }

    ngDoCheck(): void {
        this.applyDisability(this.field.formControl.disabled);
    }

    private detachEvent() {
        if (this.formCheckboxSubscription) {
            this.formCheckboxSubscription.unsubscribe();
        }

        if (this.formControlSubscription) {
            this.formControlSubscription.unsubscribe();
        }
    }

    private attachEvent() {

        this.formCheckboxSubscription = this.formCheckbox.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
            this.formControl.setValue(checked);
            this.refreshNumberOfSelected();
        });

        this.formControlSubscription = this.field.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
            if (checked) {
                Object.keys(this.formCheckbox.controls).forEach(option => {
                    this.formCheckbox.get(option).setValue(checked[option] || false, { emitEvent: false });
                });
            }
            this.refreshNumberOfSelected();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    toggleSelectAll() {
        const value = this.numberOfSelected === 0;
        Object.keys(this.formCheckbox.controls).forEach(controlName => {
            this.formCheckbox.get(controlName).setValue(value, { emitEvent: true });
        });
    }

    refreshNumberOfSelected() {
        this.numberOfSelected = Object.keys(this.formCheckbox.controls)
            .filter((control) => !!this.formCheckbox.controls[control].value).length;
    }

    private updateForm(options) {
        const oldValues = { ... this.formCheckbox.value };
        this.removeAllOptions();
        options.map(option => {
            const control: FormControl = new FormControl(option.key in oldValues ? oldValues[option.key] : option.value);
            this.formCheckbox.addControl(
                option.key,
                control
            );
            return control;
        });
        this.checkboxLength = Object.keys(this.formCheckbox.controls).length;
    }

    private updateValues() {
        if (this.field.formControl.value) {
            Object.keys(this.field.formControl.value).forEach(option => {
                this.formCheckbox.get(option).setValue(this.field.formControl.value[option], { emitEvent: false });
            });
        }
    }

    private getOptionsAsObservabe(): Observable<any> {
        if (!(this.to.options instanceof Observable)) {
            return of(this.to.options);
        }
        return this.to.options;
    }

    private removeAllOptions() {
        Object.keys(this.formCheckbox.controls).forEach(optionId => {
            this.formCheckbox.removeControl(optionId);
        });
    }

    private applyDisability(value: boolean) {
        if (value !== this.formCheckbox.disabled) {
            if (value) {
                this.formCheckbox.disable();
            } else {
                this.formCheckbox.enable();
            }
        }
    }
}
