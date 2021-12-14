import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { ListFieldToDisplay, TextboxFieldToDisplay } from './list-field-to-display.interface';

@Component({
    selector: 'daenae-help-plan-wrapper',
    templateUrl: './help-plan-wrapper.component.html',
    styleUrls: ['./help-plan-wrapper.component.scss']
})
export class HelpPlanWrapperComponent extends FieldWrapper implements OnInit, DoCheck, OnDestroy {

    fieldsToDisplay$: Subject<(ListFieldToDisplay | TextboxFieldToDisplay)[]> = new Subject();
    refresh = true;

    ngOnInit() {
    }

    ngDoCheck() {
        if (this.to.fields && this.to.refresh) {
            const fieldsNotNull = this.to.fields.reduce((acc, current) => {
                if (this.model[current.key]) {
                    if (current.type === 'text') {
                        return [...acc, {
                            type: 'text',
                            value: current.setValue ? current.setValue(this.model[current.key]) : this.model[current.key],
                            label: current.label
                        }];
                    } else {
                        const reduced = this.reduceMap(this.model[current.key], current.label, current.setValue);
                        if (reduced) {
                            return [...acc, reduced];
                        }
                    }
                }
                return acc;
            }, []);
            this.fieldsToDisplay$.next(fieldsNotNull);
        }
    }

    ngOnDestroy(): void {
        this.fieldsToDisplay$.complete();
    }

    openPopin() {
        if (this.to.openPopin) {
            this.to.openPopin(this.model, this.formState, this.field);
        }
    }

    deletePlan() {
        if (this.to.deletePlan) {
            this.to.deletePlan(this.model, this.formState, this.field);
        }
    }

    private reduceMap(dico, label: string, setValueFn?: Function): ListFieldToDisplay {
        const reduced =  {
            type: 'list',
            label,
            values: Object.keys(dico).reduce((acc, current) => {
                if (dico[current]) {
                    return [...acc, (setValueFn) ? setValueFn(current) : dico];
                }
                return acc;
            }, [])
        };
        return (reduced && reduced.values.length ? reduced : null) as ListFieldToDisplay;
    }
}
