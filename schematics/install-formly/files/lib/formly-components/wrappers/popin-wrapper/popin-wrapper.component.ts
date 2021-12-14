import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FieldWrapper, FormlyFieldConfig } from '@ngx-formly/core';


@Component({
    selector: 'daenae-popin-wrapper',
    templateUrl: './popin-wrapper.component.html',
    styleUrls: ['./popin-wrapper.component.scss']
})
export class PopinWrapperComponent extends FieldWrapper implements OnInit {

    @ViewChild('fieldComponent', { read: ViewContainerRef })
    fieldComponent: ViewContainerRef;

    ngOnInit(): void {
        this.options.updateInitialValue();
        this.to.hidden = false;
    }

    public buttonsClicked(validated: boolean): void {
        this.to.hidden = true;
        if (validated) {
            this.options.updateInitialValue();
        } else {
            this.options.resetModel();
        }
        if (this.to.buttonClicked) {
            this.to.buttonClicked(this.model, this.formState, this.field, validated);
        }
    }
}
