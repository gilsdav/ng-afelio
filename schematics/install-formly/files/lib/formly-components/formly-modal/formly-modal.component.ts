import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { scrollToError } from '../../helpers/controls-errors.helper';
import { markAllControlsAsTouched } from '../../helpers/formgroup.helper';
import { FormlyModalConfig } from './formly-modal-config.interface';
import { FormlyModalSizeEnum } from './formly-modal-size.enum';

@Component({
    selector: 'daenae-formly-modal',
    templateUrl: './formly-modal.component.html',
    styleUrls: []
})
export class FormlyModalComponent implements OnInit {

    public classes = 'col-10 col-md-6 col-lg-4';

    constructor(
        public dialogRef: MatDialogRef<FormlyModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: FormlyModalConfig
    ) { }

    ngOnInit() {
        if (!this.data.formConfig) {
            throw new Error('You must give a formly config to this type of modal.');
        }
        if (this.data.size === FormlyModalSizeEnum.Large) {
            this.classes = '-medium col-10 col-lg-8';
        }
    }

    /**
     * Close the dialog
     * @param returnData the data to return
     */
    public closeDialog(returnData?: any) {
        this.dialogRef.close(returnData);
    }

    public submit() {
        markAllControlsAsTouched(this.data.formConfig.formGroup);
        if (this.data.formConfig.formGroup.valid) {
            this.closeDialog(this.data.formConfig.model);
        } else {
            scrollToError();
        }
    }

    public actionClicked(key: string) {
        this.closeDialog(key);
    }

}
