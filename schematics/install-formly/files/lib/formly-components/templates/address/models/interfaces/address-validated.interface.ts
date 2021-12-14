import { Address } from '../address.model';

export interface AddressValidatedInterface {
    isValidated: boolean;
    nis9Code?: string;
    nis9Title?: string;
    address: Address;
}
