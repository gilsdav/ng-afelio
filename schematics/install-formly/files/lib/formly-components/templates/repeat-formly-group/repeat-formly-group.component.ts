import { ChangeDetectionStrategy, Component, DoCheck, Inject, OnDestroy, OnInit, Optional, ViewChildren } from '@angular/core';
import { FieldArrayType, FormlyFieldConfig, FormlyFormBuilder, FORMLY_CONFIG } from '@ngx-formly/core';
import { isNil } from 'lodash';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

export interface MinMaxInterface {
    min: number;
    max: number;
}

/**
 * Usage example:
 *    key: 'repeatKey',
 *    type: 'repeat',
 *    className: ''   // name of the class to add (mainly used to place the buttons),
 *    templateOptions: {
 *        addText: 'ADD',
 *        maxRepeat: 3, // the number of max items (can be an Observable<number>)
 *        minRepeat: 1 // the number of min items (can be an Observable<number>),
 *        tooltipMax: '' // the string to show when the button is disabled when it has reached the maximum number of groups
 *    },
 *    fieldArray: {
 *        fieldGroup: [] //  FIELDCONFIG
 *    }
 */

@Component({
    selector: 'daenae-repeat-formly-group',
    templateUrl: './repeat-formly-group.component.html',
    styleUrls: ['./repeat-formly-group.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class RepeatFormlyGroupComponent extends FieldArrayType implements OnInit, OnDestroy, DoCheck {

    @ViewChildren('fieldRepeated') fieldRepeated;

    constructor(@Inject(FORMLY_CONFIG) @Optional() builder?: FormlyFormBuilder) {
        super(builder);
    }

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            maxRepeat: null,
            minRepeat: null,
            tooltipMax: '',
            firstRepeatLabel: '',
            firstRepeatSubLabel: '',
            left: true,
            cardButton: false,
            noSidebar: false,
            repeatIndex: 0,
            showAddButton: true,
            showRemoveButton: true,
            bottomBar: false,
            emptyDisableMessage: '',
            cardWrapper: true,
            canDuplicate: false,
            deleteClicked: null,
            addClicked: null,
            preDuplicate: null,
            postDuplicate: null,
            noElementText: null,
            addButtonNoElementClasses: null
        }
    };

    public minMax$: Observable<MinMaxInterface>;
    private destroy$: Subject<boolean> = new Subject<boolean>();
    private minMaxRefresh$: Subject<boolean> = new Subject<boolean>();

    private previousMin: number | Observable<number>;
    private previousMax: number | Observable<number>;

    ngOnInit() {
        this.to.add = this.add.bind(this);
        this.to.remove = this.remove.bind(this);
    }

    ngDoCheck() {
        if (this.to.minRepeat !== this.previousMin || this.to.maxRepeat !== this.previousMax) {
            this.previousMin = this.to.minRepeat;
            this.previousMax = this.to.maxRepeat;
            this.minMaxRefresh$.next(true);
            this.minMax$ = this.getMinMaxRepeat();
            this.setMinMax();
        }
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
        this.minMaxRefresh$.complete();
    }

    private setMinMax() {
        this.minMax$
            .pipe(takeUntil(this.minMaxRefresh$))
            .pipe(takeUntil(this.destroy$))
            .subscribe((minMax: MinMaxInterface) => {
                const min = minMax.min;
                const fieldMoreNeeded = (min || 0) - this.field.fieldGroup.length;

                if (fieldMoreNeeded > 0) {
                    for (let i = 0; i < fieldMoreNeeded; i++) {
                        this.add();
                    }
                }
            });
    }

    private getMinMaxRepeat(): Observable<MinMaxInterface> {
        const min$ = (this.to.minRepeat instanceof Observable) ? this.to.minRepeat : of(this.to.minRepeat);
        const max$ = (this.to.maxRepeat instanceof Observable) ? this.to.maxRepeat : of(this.to.maxRepeat);
        return combineLatest([min$, max$]).pipe(
            map(([min, max]) => ({
                min: isNil(min) || min >= 0 ? min : 0,
                max: isNil(max) || max > 0 ? max : null
            })
        ));
    }

    public fillIndex(field: FormlyFieldConfig, index: number): FormlyFieldConfig {
        if (!field.templateOptions) {
            field.templateOptions = {};
        }
        field.templateOptions.repeatIndex = index ? index : 0;
        return field;
    }

    public canAddGroup(minMax: MinMaxInterface) {
        return (minMax.max ? this.field.fieldGroup.length < minMax.max : true);
    }

    public canRemoveGroup(minMax: MinMaxInterface) {
        return (minMax.min ? this.field.fieldGroup.length > minMax.min : true);
    }

    public deleteItem(index: number, minMax: MinMaxInterface) {
        if (this.canRemoveGroup(minMax)) {
            this.remove(index);
            if (this.to.deleteClicked) {
                this.to.deleteClicked(index, this.field);
            }
        }
    }

    public addItem(minMax: MinMaxInterface) {
        if (this.canAddGroup(minMax)) {
            this.add();
            if (this.to.addClicked) {
                this.to.addClicked(this.field);
            }
        }
    }

    public duplicateItem(index: number, minMax: MinMaxInterface) {
        if (this.canAddGroup(minMax)) {
            if (this.to.preDuplicate) {
                this.to.preDuplicate(this.field);
            }
            const modelToDuplicate = {...this.field.fieldGroup[index].model};
            this.add(undefined, modelToDuplicate);
            if (this.to.postDuplicate) {
                this.to.postDuplicate(this.field);
            }
            setTimeout(() => {
                this.fieldRepeated.last.elementRef.nativeElement.scrollIntoView({behavior: 'smooth' });
            }, 0 );
        }
    }
}
