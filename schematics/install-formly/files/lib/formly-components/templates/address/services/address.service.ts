import { Injectable } from '@angular/core';
import { AddressIsValidedDto, ProxyServiceGen } from '@fcsd-daenae/AddressApi';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddressInfo } from '../models/address-info.model';
import { Address } from '../models/address.model';

@Injectable()
export class AddressService {
    constructor(
        private addressService: ProxyServiceGen) { }

    public getAddressesAutoComplete(addressToSearch: string): Observable<string[]> {
        return this.addressService.autocompleteGet$Json({ query: addressToSearch });
    }

    public validateAddress(address: string): Observable<Address> {

        return this.addressService.validateUnstructuredGet$Json({ address: address }).pipe(
            map((data: AddressIsValidedDto) => Address.fromAddressIsValidatedDto(data))
        );
    }

    public validateStructuredAddress(address: AddressInfo): Observable<Address> {
        return this.addressService.validateStructuredPost$Json({ body: address.toDto() }).pipe(
            map((data: AddressIsValidedDto) => Address.fromAddressIsValidatedDto(data))
        );
    }
}
