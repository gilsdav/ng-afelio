import { ChangeDetectionStrategy, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'daenae-simple-field-wrapper',
  templateUrl: './simple-field-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class SimpleFieldWrapperComponent extends FieldWrapper implements OnInit {

    @ViewChild('fieldComponent', { read: ViewContainerRef })
    fieldComponent: ViewContainerRef;

    public forcedHeight?: number = null;

    ngOnInit() {
        this.forcedHeight = !(this.to && this.to.label || '').trim() ? 0 : null;
    }
}
