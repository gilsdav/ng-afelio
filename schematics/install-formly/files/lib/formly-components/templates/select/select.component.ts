import { Component, DoCheck } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { isEqual, isNil } from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'daenae-select',
    templateUrl: './select.component.html',
    styleUrls: []
})
export class SelectComponent extends FieldType implements DoCheck {

    public options$: Observable<any[]>;

    defaultOptions: FormlyFieldConfig =  {
        templateOptions: {
            allowUnavailableOption: false,
            valueToLabelMapper: null,
            compareWith: null
        }
    };

    private previousSetValueTimeout: any;
    private previousOptions: any[] | Observable<any[]> ;

    ngDoCheck(): void {
        if (this.to.options !== this.previousOptions) {
            this.previousOptions = this.to.options;
            this.options$ = this.getOptionsObservable();
        }
    }

    private getOptionsObservable(): Observable<any[]> {
        return this.getOptionsAsObservable().pipe(
            map((options: any[]) => {
                if (options) {
                    const values = options?.map(option => option.value);
                    let newOptions = options;
                    if (this.previousSetValueTimeout) {
                        clearTimeout(this.previousSetValueTimeout);
                    }
                    if (
                        this.to.allowUnavailableOption &&
                        !isNil(this.formControl.value) &&
                        isNil(values.find(e => this.compareWith(e, this.formControl.value)))
                    ) {
                        newOptions = [...newOptions, {
                            value: this.formControl.value,
                            label: this.mapDefaultOptionValueToLabel(this.formControl.value)
                        }];
                    }
                    this.previousSetValueTimeout = setTimeout(() => {
                        if (
                            !this.to.allowUnavailableOption &&
                            !isNil(this.formControl.value) &&
                            isNil(values.find(e => this.compareWith(e, this.formControl.value)))
                        ) {
                            this.formControl.setValue(null, {emitEvent: true});
                        } else {
                            this.formControl.setValue(this.formControl.value, {emitEvent: false});
                        }
                    }, 0);
                    return newOptions;
                }
                return [];
            }
        ));
    }

    public compareWith = (a: any, b: any) => {
        if (this.to.compareWith) {
            return this.to.compareWith(a, b);
        } else {
            return isEqual(a, b);
        }
    }

    public mapDefaultOptionValueToLabel(value: any) {
        if (this.to.valueToLabelMapper) {
            return this.to.valueToLabelMapper(value);
        }
        return value;
    }

    private getOptionsAsObservable(): Observable<any> {
        return this.to.options instanceof Observable ? this.to.options : of(this.to.options);
    }
}
