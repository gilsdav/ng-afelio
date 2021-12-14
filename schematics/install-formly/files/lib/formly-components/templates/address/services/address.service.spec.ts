/* tslint:disable:no-unused-variable */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AddressApiConfiguration, AddressInfoDto, AddressIsValidedDto, ProxyServiceGen } from '@fcsd-daenae/AddressApi';
import { of } from 'rxjs';
import { Address } from '../models/address.model';
import { AddressService } from './address.service';

describe('Service: AddressService', () => {
    let service;
    let addressServiceGen;

    const addressInfoDto: AddressInfoDto = {
        boxNumber: '1',
        city: 'Liège',
        floor: '2',
        houseNumber: '3',
        postalCode: '4000',
        streetName: 'Boulevard de la Sauvenière',
        ins9: '123456789'
    };

    const addressIsValidDto: AddressIsValidedDto = {
        address: addressInfoDto,
        isValided: true
    };

    const addressValidated: Address = new Address({
        boxNumber: '1',
        city: 'Liège',
        houseNumber: '3',
        postalCode: '4000',
        streetName: 'Boulevard de la Sauvenière',
        isValidated: true,
        floor: '2',
        nis9Code: '123456789',
        nis9Title: undefined
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
        providers: [AddressService, ProxyServiceGen, AddressApiConfiguration, Router],
        imports: [HttpClientTestingModule]
        });
    }));

    beforeEach(() => {
        service = TestBed.get(AddressService);
        addressServiceGen = TestBed.get(ProxyServiceGen);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('should map correctly the dto of the validated address', () => {
        spyOn(addressServiceGen, 'validateUnstructuredGet$Json').and.returnValue(of(addressIsValidDto));
        service.validateAddress('address').subscribe(result => {
            expect(addressServiceGen.validateUnstructuredGet$Json).toHaveBeenCalledWith({address: 'address'});
            expect(result).toEqual(addressValidated);
        });
    });
});
