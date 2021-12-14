import { AfterViewInit, Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { isEqual, pick, pickBy } from 'lodash';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { map, skip, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AddressInfo } from './models/address-info.model';
import { Address } from './models/address.model';
import { AddressFormEnum } from './models/enums/address-form.enum';
import { AddressValidatedInterface } from './models/interfaces/address-validated.interface';
import { StatisticalDistrict } from './models/statistical-district.model';
import { AddressService } from './services/address.service';
import { StatisticalDistrictService } from './services/statistical-district.service';

@Component({
    selector: 'daenae-address',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.scss']
})
export class AddressComponent extends FieldType implements OnInit, DoCheck, OnDestroy, AfterViewInit {

    public addressFormGroup: FormGroup;
    public shouldShowAllAddressFields$ = new BehaviorSubject<boolean>(false);
    public shouldShowValidated$ = new BehaviorSubject<AddressValidatedInterface>(null);
    public AddressFormEnum = AddressFormEnum;
    public addressValue: Address;
    public isRequired: boolean;
    private _requiredFields = [
        AddressFormEnum.STREETNAME,
        AddressFormEnum.STREETNUMBER,
        AddressFormEnum.POSTALCODE,
        AddressFormEnum.MUNICIPALITY
    ];
    private addressHasChanged = false;

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            hasNis9Event: () => {},
            allFieldsShowed: () => { },
            showAllFields: false,
            showValidated: false,
            displayInitializedAddressOnce: false
        }
    };

    private destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private statisticalDistrictService: StatisticalDistrictService,
        private addressService: AddressService) {
        super();
    }

    ngOnInit(): void {
        this.addressFormGroup = new FormGroup({
            streetName: new FormControl(''),
            streetNumber: new FormControl(''),
            boxNumber: new FormControl(''),
            postalCode: new FormControl(''),
            municipality: new FormControl(''),
            floor: new FormControl(''),
            addressAutocomplete: new FormControl('')
        });

        if (this.to.required) {
            this.isRequired = true;
            this.addressFormGroup.get(AddressFormEnum.STREETNAME).setValidators([Validators.required]);
            this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).setValidators([Validators.required]);
            this.addressFormGroup.get(AddressFormEnum.POSTALCODE).setValidators([Validators.required]);
            this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).setValidators([Validators.required]);
        }

        if (this.to.disabled) {
            this.addressFormGroup.disable();
        }

        this.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((address: Address) => {
            this.addressValue = address;
            if (!address) {
                this.shouldShowAllAddressFields$.next(false);
                this.shouldShowValidated$.next(null);
                this.addressFormGroup.reset();
                return;
            }
            this.to.allFieldsShowed();
            this.shouldShowAllAddressFields$.next(true);
            this.addressFormGroup.get(AddressFormEnum.STREETNAME).setValue(address.streetName, { emitEvent: false });
            this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).setValue(address.houseNumber, { emitEvent: false });
            this.addressFormGroup.get(AddressFormEnum.BOXNUMBER).setValue(address.boxNumber, { emitEvent: false });
            this.addressFormGroup.get(AddressFormEnum.POSTALCODE).setValue(address.postalCode, { emitEvent: false });
            this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).setValue(address.city, { emitEvent: false });
            this.addressFormGroup.get(AddressFormEnum.FLOOR).setValue(address.floor, { emitEvent: false });

            this.applyErrorsOfFormly();
        });
        if (!this.to.initializedAddress && this.formControl.value) {
            const address: Address = this.formControl.value;
            this.addressValue = address;
            if (address) {
                this.shouldShowValidated$.next({
                    nis9Title: address.nis9Title,
                    isValidated: address.isValidated,
                    address
                });
            }
            this.addressFormGroup.setValue({
                [AddressFormEnum.STREETNAME]: address.streetName,
                [AddressFormEnum.STREETNUMBER]: address.houseNumber,
                [AddressFormEnum.BOXNUMBER]: address.boxNumber,
                [AddressFormEnum.POSTALCODE]: address.postalCode,
                [AddressFormEnum.MUNICIPALITY]: address.city,
                [AddressFormEnum.FLOOR]: address.floor,
                [AddressFormEnum.ADDRESS]: ''
            }, { emitEvent: false });
        }

        this.addressFormGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.shouldShowValidated$.pipe(
                skip(1),
                take(1)
            ).subscribe((addressValidated) => {
                const currentAddress = this.formControl.value;
                const propertiesToCheck = [
                    'postalCode',
                    'streetName',
                    'houseNumber',
                    'city',
                    'boxNumber',
                    'floor'
                ];
                const pickCurrentAddress = pickBy(pick(currentAddress, propertiesToCheck), (a) => !!a);
                const pickCurrent = pickBy(pick(addressValidated?.address, propertiesToCheck), (a) => !!a);
                if (isEqual(
                    pickCurrentAddress,
                    pickCurrent
                    )) {
                    this.formControl.setValue(new Address({
                        ...currentAddress,
                        isValidated: addressValidated?.isValidated,
                        nis9Code: addressValidated?.nis9Code,
                        nis9Title: addressValidated?.nis9Title
                    }));
                }
            });
            this.addressHasChanged = true;
            this.formControl.setValue(new Address({
                ...this.formControl.value,
                streetName: this.addressFormGroup.get(AddressFormEnum.STREETNAME).value,
                houseNumber: this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).value,
                boxNumber: this.addressFormGroup.get(AddressFormEnum.BOXNUMBER).value,
                postalCode: this.addressFormGroup.get(AddressFormEnum.POSTALCODE).value,
                city: this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).value,
                floor: this.addressFormGroup.get(AddressFormEnum.FLOOR).value,
            }));
        });
    }
    ngAfterViewInit() {
        if (this.to.displayInitializedAddressOnce) {
            this.to.initializedAddress = null;
        }
    }

    ngDoCheck(): void {
        this.applyDisability(this.field.formControl.disabled);
        this.applyRequired(this.to.required);
    }

    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.complete();
        this.shouldShowAllAddressFields$.complete();
        this.shouldShowValidated$.complete();
    }

    public onBlur(addressValidatedInterface?: AddressValidatedInterface) {
        if (this.addressHasChanged) {
            let addressValidatedInterface$ = of(addressValidatedInterface);
            if (!addressValidatedInterface ) {
                if (this.addressFormGroup.valid && this.to.showValidated) {
                    const addressInfo = {
                        boxNumber: this.addressFormGroup.get(AddressFormEnum.BOXNUMBER).value,
                        city: this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).value,
                        floor: this.addressFormGroup.get(AddressFormEnum.FLOOR).value,
                        houseNumber: this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).value,
                        postalCode: this.addressFormGroup.get(AddressFormEnum.POSTALCODE).value,
                        streetName: this.addressFormGroup.get(AddressFormEnum.STREETNAME).value
                    };


                    addressValidatedInterface$ = this.addressService.validateStructuredAddress(new AddressInfo(addressInfo)).pipe(
                        map(address => {
                            return {
                                ...address,
                                address: new Address(addressInfo)
                            };
                        })
                    );
                } else {
                    this.shouldShowValidated$.next(null);
                    return;
                }
            }
            addressValidatedInterface$.pipe(
                take(1),
                tap(addressValidated => this.to.hasNis9Event(addressValidated.nis9Code, this.formState, this.field)),
                switchMap((addressValidated: AddressValidatedInterface) => {
                    if (addressValidated && addressValidated.isValidated && addressValidated.nis9Code) {
                        return this.statisticalDistrictService.getStatisticalDistrictByNis9Code(addressValidated.nis9Code).pipe(
                            take(1),
                            map((statisticalDistrict: StatisticalDistrict) => ({
                                nis9Title: statisticalDistrict.nis9.name,
                                isValidated: addressValidated.isValidated,
                                address: addressValidated.address,
                                nis9Code: addressValidated.nis9Code
                            })),
                        );
                    } else {
                        return of({ isValidated: false, address: addressValidated.address });
                    }
                })
            )
                .subscribe((result: AddressValidatedInterface) => {
                    this.shouldShowValidated$.next(result);
                    this.addressHasChanged = false;
                });
        }
    }


    private applyDisability(value: boolean) {
        if (value !== this.addressFormGroup.disabled) {
            if (value) {
                this.addressFormGroup.disable();
            } else {
                this.addressFormGroup.enable();
                this.to.initializedAddress = null;
            }
        }
    }

    public applyRequired(value: boolean) {
        if (value !== this.isRequired) {
            if (value) {
                this.addressFormGroup.get(AddressFormEnum.STREETNAME).setValidators([Validators.required]);
                this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).setValidators([Validators.required]);
                this.addressFormGroup.get(AddressFormEnum.POSTALCODE).setValidators([Validators.required]);
                this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).setValidators([Validators.required]);
            } else {
                this.addressFormGroup.get(AddressFormEnum.STREETNAME).setValidators([]);
                this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).setValidators([]);
                this.addressFormGroup.get(AddressFormEnum.POSTALCODE).setValidators([]);
                this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).setValidators([]);
            }
            this.isRequired = value;
            this.addressFormGroup.updateValueAndValidity();
        }
    }

    private applyErrorsOfFormly() {
        let errors = {};

        if (this.addressFormGroup.errors) {
            errors = { ...this.addressFormGroup.errors };
        }

        for (const control of this._requiredFields) {
            if (this.addressFormGroup.get(control).errors) {
                errors = { ...this.addressFormGroup.get(control).errors };
            }
        }

        if (!Object.keys(errors).length) {
            errors = null;
        }
        this.formControl.setErrors(errors);
    }

    public setShouldShowAllAddressFields(shouldShowAddresses: boolean) {
        this.shouldShowAllAddressFields$.next(shouldShowAddresses);
        if (shouldShowAddresses) {
            this.to.allFieldsShowed();
        }
    }

    public hasError(type: AddressFormEnum): boolean {
        return this.addressFormGroup.get(type).errors && (this.showError || this.addressFormGroup.get(type).touched);
    }

    public isAddressEmpty(): boolean {
        return (!this.addressFormGroup.get(AddressFormEnum.STREETNAME).value
            && !this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).value
            && !this.addressFormGroup.get(AddressFormEnum.BOXNUMBER).value
            && !this.addressFormGroup.get(AddressFormEnum.POSTALCODE).value
            && !this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).value
            && !this.addressFormGroup.get(AddressFormEnum.FLOOR).value);
    }

    public clearAddressControls() {
        this.addressFormGroup.get(AddressFormEnum.STREETNAME).setValue('');
        this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).setValue('');
        this.addressFormGroup.get(AddressFormEnum.BOXNUMBER).setValue('');
        this.addressFormGroup.get(AddressFormEnum.POSTALCODE).setValue('');
        this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).setValue('');
        this.addressFormGroup.get(AddressFormEnum.ADDRESS).setValue('');
        this.addressFormGroup.get(AddressFormEnum.FLOOR).setValue('');

        this.addressFormGroup.get(AddressFormEnum.STREETNAME).enable();
        this.addressFormGroup.get(AddressFormEnum.STREETNUMBER).enable();
        this.addressFormGroup.get(AddressFormEnum.BOXNUMBER).enable();
        this.addressFormGroup.get(AddressFormEnum.POSTALCODE).enable();
        this.addressFormGroup.get(AddressFormEnum.MUNICIPALITY).enable();
        this.addressFormGroup.get(AddressFormEnum.ADDRESS).enable();
        this.addressFormGroup.get(AddressFormEnum.FLOOR).enable();
        this.shouldShowValidated$.next(null);
    }


}
