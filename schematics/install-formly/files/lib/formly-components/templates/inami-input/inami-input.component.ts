import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { blockPastSpecialCharracters, checkSpecialCharacters } from '../../../helpers/textinputfilter.helper';

@Component({
  selector: 'daenae-text',
  templateUrl: './inami-input.component.html',
  styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class InamiInputComponent extends FieldType implements OnInit, OnDestroy {

    public checkSpecialCharacters = checkSpecialCharacters;
    public blockPastSpecialCharracters = blockPastSpecialCharracters;

    private destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private cdr: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        this.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.cdr.markForCheck();
        });
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

}

