import {
    ChangeDetectionStrategy, Component, EventEmitter,
    Input, OnDestroy, OnInit, Output,
    ViewEncapsulation
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AddressService } from '../../services/address.service';

@Component({
    selector: 'daenae-address-autocomplete',
    templateUrl: './address-autocomplete.component.html',
    styleUrls: ['./address-autocomplete.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class AddressAutocompleteComponent implements OnInit, OnDestroy {
    public autoCompleteAddress$: BehaviorSubject<string[]> = new BehaviorSubject([]);
    public selectedAddress: string;
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    @Input() addressControl: FormControl;

    @Output() addressSelected = new EventEmitter<string>();

    private destroy$: Subject<boolean> = new Subject();

    constructor(
        private addressService: AddressService,
    ) { }

    ngOnInit() {
        this.addressControl.valueChanges
            .pipe(
                takeUntil(this.destroy$),
                tap(() => {
                    this.isLoading$.next(true);
                }),
                debounceTime(300),
                distinctUntilChanged(),
                switchMap(newValue => {
                    if (!!newValue && this.selectedAddress !== newValue) {
                        return this.addressService.getAddressesAutoComplete(newValue);
                    }
                    return of([]);
                })).subscribe(value => {
                    this.autoCompleteAddress$.next(value);
                    this.isLoading$.next(false);
                });
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
        this.isLoading$.complete();
        this.autoCompleteAddress$.complete();
    }

    public selectedAddressEvent(selectedIndex: number) {
        this.selectedAddress = this.autoCompleteAddress$.getValue()[selectedIndex];
        this.addressSelected.emit(this.selectedAddress);
    }

}
