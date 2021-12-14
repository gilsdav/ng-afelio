/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { PhoneComponent } from './phone.component';

describe('PhoneComponent', () => {
    let component: PhoneComponent;
    let fixture: ComponentFixture<PhoneComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule, FormlyModule, TranslateModule.forRoot()],
            declarations: [PhoneComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PhoneComponent);
        component = fixture.componentInstance;
        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            templateOptions: {},
            form,
            formControl: form.get(controlKey),
            options: { showError: () => false }
        };
        component.form = new FormGroup({});
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    xit('should set phone number to formly form', () => {
        component.phoneFormGroup.setValue({ prefix: '+32', phone: '491234567' });
        expect(component.formControl.value).toEqual('+32491234567');
    });
});
