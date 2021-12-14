/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMaskModule } from 'ngx-mask';
import { FormlyModule } from '@ngx-formly/core';
import { PriceComponent } from './price.component';


describe('PriceComponent', () => {
    let component: PriceComponent;
    let fixture: ComponentFixture<PriceComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                TranslateModule.forRoot(),
                NgxMaskModule.forRoot(),
                FormlyModule
            ],
            declarations: [
                PriceComponent
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PriceComponent);
        component = fixture.componentInstance;
        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            templateOptions: {
                costInterval: of({
                    min: 100,
                    max: 20000000
                })
            },
            form,
            formControl: form.get(controlKey),
            options: { showError: () => false }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should contain control', () => {
        const control = component.formControl;
        expect(control).toBeTruthy();
    });

    it('should check if mask is effective', () => {
        const price = component.formControl;
        price.setValue('12345678');
        expect(price.valid).toBeTruthy();
        const priceInput = fixture.debugElement.query(By.css('input'));
        expect(priceInput.nativeElement.value).toEqual('12.345.678');
    });

    it('should check if value stays the same with mask', () => {
        const price = component.formControl;
        price.setValue('12345678');
        expect(price.value).toEqual('12345678');
    });

    it('should check if letters & symbols dont show', () => {
        const price = component.formControl;
        price.setValue('1a@2b-3c"4d_');
        expect(price.value).toEqual('1234');
    });

    it('should set showInformationMessage to true if amount out of min range', () => {
        const control = component.formControl;
        control.setValue(0);

        expect(control.errors).toEqual({outOfRange: true});
    });

    it('should set showInformationMessage to true if amount out of max range', () => {
        const control = component.formControl;
        control.setValue(30000000);

        expect(control.errors).toEqual({outOfRange: true});
    });

    it('should set showInformationMessage to false if amount is in range', () => {
        const control = component.formControl;
        control.setValue(110);

        expect(control.errors).toBeFalsy();
    });
});
