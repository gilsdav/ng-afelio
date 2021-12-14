import { Validators } from '@angular/forms';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { blockPastSpecialCharracters, checkSpecialCharacters } from '../../../helpers/textinputfilter.helper';

@Component({
  selector: 'daenae-text',
  templateUrl: './text.component.html',
  styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TextComponent extends FieldType implements OnInit, OnDestroy {

    private destroy$: Subject<boolean> = new Subject<boolean>();

    checkSpecialCharacters = checkSpecialCharacters;
    blockPastSpecialCharracters = blockPastSpecialCharracters;

    defaultOptions = {
        validators: {
            validation: [Validators.maxLength(250)],
        },
        templateOptions: {
            acceptSpaces: true,
            className: ''
        }
    };

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

