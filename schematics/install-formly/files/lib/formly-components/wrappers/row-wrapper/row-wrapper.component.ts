import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
    selector: 'daenae-row-wrapper',
    templateUrl: './row-wrapper.component.html',
    styleUrls: ['./row-wrapper.component.scss']
})
export class RowWrapperComponent extends FieldWrapper {

    @ViewChild('fieldComponent', { read: ViewContainerRef })
    fieldComponent: ViewContainerRef;

}
