import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PriceRangeValidator } from '../../validators/price-range.validator';

export interface PriceRange {
    min: number;
    max: number;
}
@Component({
    selector: 'daenae-price',
    templateUrl: './price.component.html',
    styleUrls: ['./price.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceComponent extends FieldType implements OnInit, OnDestroy {
    private destroy$: Subject<boolean> = new Subject();
    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            costInterval: { min: null, max: null }
        }
    };

    ngOnInit() {
        this.getMinMax().pipe(takeUntil(this.destroy$)).subscribe(costInterval => {
            this.to.min = costInterval.min;
            this.to.max = costInterval.max;
            this.formControl.updateValueAndValidity();
        });

        const validators = [];
        if (this.to.costInterval) {
            validators.push(PriceRangeValidator.outOfRange(this.to));
        }
        if (this.to.required) {
            validators.push(Validators.required);
        }
        this.formControl.setValidators(validators);
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    private getMinMax(): Observable<PriceRange> {
        return this.to.costInterval instanceof Observable ? this.to.costInterval : of(this.to.costInterval);
    }
}
