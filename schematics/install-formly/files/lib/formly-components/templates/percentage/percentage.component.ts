import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
    selector: 'daenae-percentage',
    templateUrl: './percentage.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PercentageComponent extends FieldType implements OnInit {
    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            min: 0,
            max: 100
        }
    };

    ngOnInit() { }

    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === '.' || event.key === ',') {
            event.preventDefault();
        }
    }

    public onPaste(event: ClipboardEvent): void {
        const clipboardData: DataTransfer = event.clipboardData || window['clipboardData'];
        const toPaste = clipboardData.getData('text/plain');
        if (!/^\d*$/.test(toPaste)) {
            event.preventDefault();
        }
    }

}
