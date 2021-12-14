import { FormlyModule } from '@ngx-formly/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FormlyModalConfig } from './formly-modal-config.interface';
import { FormlyModalComponent } from './formly-modal.component';


describe('FormlyModalComponent', () => {
    let component: FormlyModalComponent;
    let fixture: ComponentFixture<FormlyModalComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                TranslateModule.forRoot(),
                FormlyModule.forRoot(),
                ReactiveFormsModule
            ],
            declarations: [FormlyModalComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: {
                    formConfig: {
                        formGroup: new FormGroup({}),
                        formlyConfig: [],
                        model: {}
                    },
                    labels: {
                        cancel: '',
                        submit: '',
                        title: ''
                    }
                } as FormlyModalConfig }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FormlyModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
