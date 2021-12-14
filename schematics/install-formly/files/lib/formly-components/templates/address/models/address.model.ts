import { AddressIsValidedDto } from '@fcsd-daenae/AddressApi';
import { AddressDto } from '@fcsd-daenae/BeneficiaryApi';
export class Address {

    postalCode?: string;
    streetName?: string;
    houseNumber?: string;
    city?: string;
    boxNumber?: string;
    floor?: string;
    isValidated: boolean;
    nis9Code?: string;
    nis9Title?: string;

    constructor(base?: Partial<Address>) {
        if (base) {
            Object.assign(this, base);
        }
    }

    public static fromDto(dto: AddressDto): Address {
        if (dto === null) {
            return null;
        }
        return new Address({
            postalCode: dto.postalCode,
            streetName: dto.streetName,
            houseNumber: dto.houseNumber,
            city: dto.city,
            boxNumber: dto.boxNumber,
            floor: dto.floor,
            nis9Code: dto.nis9Code,
            nis9Title: dto.nis9Title,
            isValidated: dto.isValidated
        });
    }

    public static fromAddressIsValidatedDto(dto: AddressIsValidedDto): Address {
        if (!dto) {
            return null;
        }
        const address = Address.fromDto(dto.address as AddressDto);
        return new Address({
            ...address,
            isValidated: dto.isValided,
            nis9Code: dto.address !== null ? dto.address.ins9 : null
        });
    }

    static fromStringDto(address: string): Address {
        if (address && address.length > 0 && address.includes(',')) {
            const streetName = address.substr(0, address.indexOf(',') );
            const postalCodeIndex = address.indexOf(', ') + 2;

            const endString = address.substr(postalCodeIndex, address.length - 1);
            const postalCode = endString.substring(0, endString.indexOf(' '));
            const city = endString.substr(postalCode.length + 1, address.length - 1);

            return new Address({
                streetName, postalCode, city
            });
        }
        return null;
    }

    public toDto(): AddressDto {
        return {
            postalCode: this.postalCode,
            streetName: this.streetName,
            houseNumber: this.houseNumber,
            city: this.city,
            boxNumber: this.boxNumber,
            floor: this.floor,
        };
    }

}
