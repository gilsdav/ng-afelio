import { AddressInfoDto } from '@fcsd-daenae/AddressApi';

export class AddressInfo {
    boxNumber?: string;
    city?: string;
    coordinateX?: string;
    coordinateY?: string;
    floor?: string;
    houseNumber?: string;
    ins9?: string;
    postalCode?: string;
    streetName?: string;

    constructor(base?: Partial<AddressInfo>) {
        if (base) {
          Object.assign(this, base);
        }
    }

    public toDto(): AddressInfoDto {
        return {
            boxNumber: this.boxNumber,
            city: this.city,
            coordinateX: this.coordinateX,
            coordinateY: this.coordinateY,
            floor: this.floor,
            houseNumber: this.houseNumber,
            ins9: this.ins9,
            postalCode: this.postalCode,
            streetName: this.streetName
        };
    }
}
