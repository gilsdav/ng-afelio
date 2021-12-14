import { Component, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'daenae-app-text-information',
  templateUrl: './text-information.component.html',
  styleUrls: ['./text-information.component.scss']
})
export class TextInformationComponent extends FieldType implements OnInit {

    public showError$: Observable<boolean>;

    ngOnInit(): void {
        this.showError$ = this.formControl.statusChanges.pipe(
            map(() => this.showError)
        );
    }
}
