import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { blockPastSpecialCharracters, checkSpecialCharacters } from '../../../helpers/textinputfilter.helper';

@Component({
  selector: 'daenae-text-number',
  templateUrl: './text-number.component.html',
  styleUrls: ['./text-number.component.scss']
})
export class TextNumberComponent extends FieldType implements OnInit {

    private destroy$: Subject<boolean> = new Subject<boolean>();

    checkSpecialCharacters = checkSpecialCharacters;
    blockPastSpecialCharracters = blockPastSpecialCharracters;

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
