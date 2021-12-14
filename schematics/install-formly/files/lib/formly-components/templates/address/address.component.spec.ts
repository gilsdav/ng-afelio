import { HttpClientTestingModule } from '@angular/common/http/testing';
/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { AddressApiConfiguration, ProxyServiceGen } from '@fcsd-daenae/AddressApi';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AddressComponent } from './address.component';
import { AddressAutocompleteComponent } from './components/address-autocomplete/address-autocomplete.component';
import { AddressFormComponent } from './components/address-form/address-form.component';
import { Address } from './models/address.model';
import { AddressFormEnum } from './models/enums/address-form.enum';
import { AddressService } from './services/address.service';
import { StatisticalDistrictService } from './services/statistical-district.service';


describe('AddressComponent', () => {
    let component: AddressComponent;
    let fixture: ComponentFixture<AddressComponent>;
    let addressService: AddressService;

    const initializedAddress = new Address({
        postalCode: '1000',
        streetName: 'Rue neuve',
        houseNumber: '1',
        city: 'Bruxelles',
        boxNumber: '2',
        floor: '3'
    });

    const validatedAddress = new Address({
        streetName: initializedAddress.streetName,
        houseNumber: initializedAddress.houseNumber,
        boxNumber: initializedAddress.boxNumber,
        postalCode: initializedAddress.postalCode,
        city: initializedAddress.city,
        isValidated: true
    });

    const requiredError = {
        required: true
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddressComponent,
                AddressFormComponent,
                AddressAutocompleteComponent
            ],
            imports: [
                ReactiveFormsModule,
                FormlyModule,
                TranslateModule.forRoot(),
                MatAutocompleteModule,
                MatTooltipModule,
                HttpClientTestingModule
            ],
            providers: [
                AddressService,
                StatisticalDistrictService,
                ProxyServiceGen,
                AddressApiConfiguration
            ]

        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressComponent);
        addressService = TestBed.inject(AddressService);
        component = fixture.componentInstance;
        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            templateOptions: {
                required: true,
                initializedAddress: null
            },
            formControl: form.get(controlKey),
            options: { showError: () => true }
        };

        spyOn(addressService, 'validateAddress').and.returnValue(of(validatedAddress).pipe(delay(300)));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('without initial value', () => {
        beforeEach(() => {
            component.field.templateOptions.initializedAddress = null;
            fixture.detectChanges();
        });

        it('should contain showMAnual button and the button should disapear and show all the the field when clicked', () => {
            let manualButton = fixture.debugElement.query(By.css('[data-test="data-manualSearch"]'));
            expect(manualButton).toBeTruthy();

            manualButton.nativeElement.dispatchEvent(new MouseEvent('click'));
            fixture.detectChanges();

            manualButton = fixture.debugElement.query(By.css('[data-test="data-manualSearch"]'));
            expect(manualButton).toBeFalsy();

            validateFieldAreEmptyEnabledAndPresent(AddressFormEnum.STREETNAME);
            validateFieldAreEmptyEnabledAndPresent(AddressFormEnum.STREETNUMBER);
            validateFieldAreEmptyEnabledAndPresent(AddressFormEnum.BOXNUMBER);
            validateFieldAreEmptyEnabledAndPresent(AddressFormEnum.POSTALCODE);
            validateFieldAreEmptyEnabledAndPresent(AddressFormEnum.MUNICIPALITY);
            validateFieldAreEmptyEnabledAndPresent(AddressFormEnum.FLOOR);
        });

        function validateFieldAreEmptyEnabledAndPresent(type: AddressFormEnum) {
            const control = component.addressFormGroup.controls[type];

            expect(control).toBeTruthy();
            expect(control.value).toEqual('');
            expect(control.enabled).toBeTruthy();
        }
    });

    describe('with initializedValue', () => {
        beforeEach( async () => {
            fixture.detectChanges();
            component.field.formControl.setValue(initializedAddress);
            await fixture.whenStable();
            fixture.detectChanges();

        });

        it('should contain all the controls', () => {
            fixture.detectChanges();
            const controls = component.addressFormGroup.controls;
            expect(controls['addressAutocomplete']).toBeTruthy();
            expect(controls['streetName']).toBeTruthy();
            expect(controls['streetNumber']).toBeTruthy();
            expect(controls['boxNumber']).toBeTruthy();
            expect(controls['postalCode']).toBeTruthy();
            expect(controls['municipality']).toBeTruthy();
            expect(controls['floor']).toBeTruthy();
        });

        it('should be initialized with the value from the templateOptions', () => {

            fixture.detectChanges();

            const controls = component.addressFormGroup.controls;

            expect(controls['streetName'].value).toEqual(initializedAddress.streetName);
            expect(controls['streetName'].disable).toBeTruthy();

            expect(controls['streetNumber'].value).toEqual(initializedAddress.houseNumber);
            expect(controls['streetNumber'].disable).toBeTruthy();

            expect(controls['boxNumber'].value).toEqual(initializedAddress.boxNumber);
            expect(controls['boxNumber'].disable).toBeTruthy();

            expect(controls['postalCode'].value).toEqual(initializedAddress.postalCode);
            expect(controls['postalCode'].disable).toBeTruthy();

            expect(controls['municipality'].value).toEqual(initializedAddress.city);
            expect(controls['municipality'].disable).toBeTruthy();

            expect(controls['floor'].value).toEqual(initializedAddress.floor);
            expect(controls['floor'].disable).toBeTruthy();
        });

        it('should validate street name', () => {
            fixture.detectChanges();
            validateField(AddressFormEnum.STREETNAME);
        });

        it('should validate street number', () => {
            fixture.detectChanges();
            validateField(AddressFormEnum.STREETNUMBER);
        });

        it('should validate postal code', () => {
            fixture.detectChanges();
            validateField(AddressFormEnum.POSTALCODE);
        });

        it('should validate municipality', () => {
            fixture.detectChanges();
            validateField(AddressFormEnum.MUNICIPALITY);
        });

        it('should not show remove-address button if form is disabled', () => {
            component.field.formControl.disable();
            fixture.detectChanges();
            const button = fixture.debugElement.query(By.css('[data-test="remove-address"]'));
            expect(button).toBeFalsy();
        });

        it('should show remove-address button if form is enabled', async () => {
            component.field.formControl.enable();
            const button = fixture.debugElement.query(By.css('[data-test="remove-address"]'));
            expect(button).toBeTruthy();
        });
    });

    function validateField(type: AddressFormEnum) {
        const control = component.addressFormGroup.get(type);
        control.enable();
        control.setValue(null);

        expect(control.errors).toEqual(requiredError);
    }

});
