import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { Validators } from '@angular/forms';
import { FieldType } from '@ngx-formly/core';
import { merge, Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { emailOrEmpty } from '../../validators/email.validator';

@Component({
  selector: 'daenae-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailComponent extends FieldType implements OnInit, OnDestroy {

    public showError$: Observable<boolean>;
    public inputBlur$ = new Subject<void>();
    private destroy$ = new Subject();
    ngOnInit(): void {

        this.formControl.setValidators([emailOrEmpty, (ctrl) => {
            return this.to.required ? Validators.required(ctrl) : null;
        }]);

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
}
