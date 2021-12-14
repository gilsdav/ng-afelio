import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { AsObservablePipe } from '../../../pipes/as-observable.pipe';

@Component({
    selector: 'daenae-toggle',
    templateUrl: './toggle.component.html',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleComponent extends FieldType implements OnInit, OnDestroy {
    public value: any;
    private destroy$ = new Subject();
    public showError$: Observable<boolean>;

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            labelProp: (item: any) => item.label,
        },
    };

    ngOnInit(): void {
        if (!this.to.options) {
            console.error(
                'You need to give "any[]" or "Observable<any[]>" in templateOptions.options'
            );
        } else if (this.to.autoDefault) {
            new AsObservablePipe()
                .transform(this.to.options)
                .pipe(takeUntil(this.destroy$))
                .subscribe((options: { value: any }[]) => {
                    if (options && options.length === 1) {
                        this.setValue(options[0].value);
                    }
                });
        }
        this.value = this.formControl.value;
        this.formControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
                if (value !== this.value) {
                    this.value = value;
                }
            });
        this.showError$ = this.formControl.statusChanges.pipe(
            map(() => this.showError)
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public getId(option: any): string {
        return `${this.key}-${option.value}_${this.id}`;
    }

    public setValue(value: any): void {
        this.formControl.setValue(value);
    }
}
