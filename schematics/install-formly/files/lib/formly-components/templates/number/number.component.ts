import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { merge, Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { onInput, onKeyDown, onPaste } from '../../../helpers/input-number.helper';

@Component({
    selector: 'daenae-number',
    templateUrl: './number.component.html',
    styleUrls: ['./number.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumberComponent extends FieldType implements OnInit, OnDestroy {
    public showError$: Observable<boolean>;
    public inputBlur$ = new Subject<void>();

    @ViewChild('numberInput') numberInput: ElementRef;

    private destroy$ = new Subject();

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            withDecimal: 0,
            showEuro: false,
            max: 999999999, // allow integer in backend
            maxLength: 9
        }
    };

    ngOnInit(): void {
        this.showError$ = merge(this.formControl.statusChanges, this.inputBlur$).pipe(
            takeUntil(this.destroy$),
            startWith(this.showError),
            map(() => this.showError)
        );
    }

    ngOnDestroy(): void {
        this.inputBlur$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    public onKeyDown(event: KeyboardEvent): void {
        onKeyDown(event, this.numberInput, this.to.withDecimal);
    }
    public onInput(event: InputEvent): void {
        onInput(event, this.formControl, this.to.maxLength, this.to.withDecimal);
    }

    public onPaste(event: ClipboardEvent): void {
        onPaste(event, this.formControl, this.to.withDecimal);
    }

}
