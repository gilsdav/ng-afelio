import { Component, DoCheck } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { isEqual } from 'lodash';

@Component({
    selector: 'daenae-multiselect',
    templateUrl: './multiselect.component.html',
    styleUrls: []
})
export class MultiselectComponent extends FieldType implements DoCheck {

    public options$: Observable<any[]>;

    defaultOptions: FormlyFieldConfig =  {
        templateOptions: {
            allowUnavailableOption: false
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
            tap((options: any[]) => {
                if (options) {
                    if (this.previousSetValueTimeout) {
                        clearTimeout(this.previousSetValueTimeout);
                    }
                    this.previousSetValueTimeout = setTimeout(() => {
                        const values = options.map(option => option.value);
                        if (
                            !this.to.allowUnavailableOption &&
                            !values.find(e => this.formControl.value?.some(v => this.compareWith(e, v)))
                        ) {
                            this.formControl.setValue(null, {emitEvent: true});
                        } else {
                            this.formControl.setValue(this.formControl.value, {emitEvent: false});
                        }
                    }, 0);
                }
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

    private getOptionsAsObservable(): Observable<any> {
        return this.to.options instanceof Observable ? this.to.options : of(this.to.options);
    }

}
