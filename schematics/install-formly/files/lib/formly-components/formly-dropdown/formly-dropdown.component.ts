import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActionButtonTypeEnum, FormlyDropdownMenuConfigInterface } from '../interfaces';

@Component({
    selector: 'daenae-formly-dropdown',
    templateUrl: './formly-dropdown.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormlyDropdownComponent {

    @Input() config: FormlyDropdownMenuConfigInterface;

    @Output() emitAction = new EventEmitter<ActionButtonTypeEnum>();

    public isVisible$ = new BehaviorSubject<boolean>(false);

    constructor() { }
    toggleDropdown() {
        this.isVisible$.next(!this.isVisible$.getValue());
    }

    buttonClicked(action: ActionButtonTypeEnum) {
        this.toggleDropdown();
        this.emitAction.emit(action);
    }
}
