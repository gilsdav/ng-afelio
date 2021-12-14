import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { merge, Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';

// Based on https://github.com/ngx-formly/ngx-formly/blob/main/src/ui/bootstrap/textarea/src/textarea.type.ts

@Component({
    selector: 'daenae-textarea',
    templateUrl: './textarea.component.html',
    styleUrls: ['./textarea.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaComponent extends FieldType implements OnInit, AfterContentChecked, OnDestroy {
    defaultOptions = {
        templateOptions: {
            cols: 1,
            maxLength: 99999,
            minRows: 4,
            onlyGrow: false
        },
    };

    private isVisible = false;
    public showError$: Observable<boolean>;
    public inputBlur$ = new Subject();
    private destroy$ = new Subject();

    constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {
        super();
    }

    ngOnInit(): void {
        this.showError$ = merge(this.formControl.statusChanges, this.inputBlur$).pipe(
            takeUntil(this.destroy$),
            map(() => this.showError)
        )
    }

    ngAfterContentChecked(): void {
        if (!this.isVisible && this.elementRef.nativeElement.offsetParent != null) {
            this.isVisible = true;
            this.refresh();
        } else if (this.isVisible && this.elementRef.nativeElement.offsetParent == null) {
            this.isVisible = false;
        }
    }

    private refresh(): void {
        this.cdr.detectChanges();
    }

    ngOnDestroy(): void {
        this.inputBlur$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }
}
