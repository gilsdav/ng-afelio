import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { take } from 'rxjs/operators';
import { Address } from '../../models/address.model';
import { AddressValidatedInterface } from '../../models/interfaces/address-validated.interface';
import { AddressService } from '../../services/address.service';

@Component({
  selector: 'daenae-address-form',
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent implements OnInit {

    @Input() controlStreet: FormControl;
    @Input() controlNumber: FormControl;
    @Input() controlBoxNumber: FormControl;
    @Input() controlPostalCode: FormControl;
    @Input() controlMunicipality: FormControl;
    @Input() controlAddressAutoComplete: FormControl;
    @Input() controlFloor: FormControl;
    @Input() initializedAddress: Address = null;

    @Input() showManual = true;

    @Output() showAllFields: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() isAddressValidated: EventEmitter<AddressValidatedInterface> = new EventEmitter<AddressValidatedInterface>();

    constructor(private addressService: AddressService) { }

    ngOnInit() {
      if (this.initializedAddress) {
        this.setBaseValues(
            this.initializedAddress.streetName,
            this.initializedAddress.houseNumber,
            this.initializedAddress.postalCode,
            this.initializedAddress.city,
            this.initializedAddress.boxNumber);

        if (this.initializedAddress.floor && this.initializedAddress.floor.trim()) {
          this.controlFloor.setValue(this.initializedAddress.floor.trim());
          this.controlFloor.disable();
        }
      }
    }



    public addressSelected(address: string) {
      this.addressService.validateAddress(address).pipe(
          take(1)
      ).subscribe((result: Address) => {
        if (result) {
          this.clearControls();
          this.setBaseValues(result.streetName, result.houseNumber, result.postalCode, result.city, result.boxNumber);
          this.showAllFields.emit(true);
          this.isAddressValidated.emit({
               isValidated: result.isValidated,
               nis9Code: result.nis9Code,
               address: result
            });
        }
      });
    }

    private setBaseValues(streetName: string, streetNumber: string, postalCode: string, municipality: string, boxNumber: string) {
        if (streetName && streetName.trim()) {
            this.controlStreet.setValue(streetName.trim(), { emitEvent: false });
            this.controlStreet.disable();
          }
          if (streetNumber && streetNumber.trim()) {
            this.controlNumber.setValue(streetNumber.trim(), { emitEvent: false });
            this.controlNumber.disable();
          }
          if (postalCode && postalCode.trim()) {
            this.controlPostalCode.setValue(postalCode.trim(), { emitEvent: false });
            this.controlPostalCode.disable();
          }
          if (municipality && municipality.trim()) {
            this.controlMunicipality.setValue(municipality.trim(), { emitEvent: false });
            this.controlMunicipality.disable();
          }
          if (boxNumber && boxNumber.trim()) {
            this.controlBoxNumber.setValue(boxNumber.trim(), { emitEvent: false });
            this.controlBoxNumber.disable();
          }
          this.controlStreet.parent.updateValueAndValidity();
    }

    private clearControls() {
      this.controlStreet.setValue('');
      this.controlNumber.setValue('');
      this.controlBoxNumber.setValue('');
      this.controlPostalCode.setValue('');
      this.controlMunicipality.setValue('');
      this.controlAddressAutoComplete.setValue('');
      this.controlFloor.setValue('');
      this.controlStreet.enable();
      this.controlNumber.enable();
      this.controlBoxNumber.enable();
      this.controlPostalCode.enable();
      this.controlMunicipality.enable();
      this.controlFloor.enable();
    }

    public manualAddress() {
      this.showManual = false;
      this.clearControls();
      this.showAllFields.emit(true);
    }

}
