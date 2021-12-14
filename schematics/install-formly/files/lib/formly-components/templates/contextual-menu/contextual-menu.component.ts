import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'daenae-contextual-menu',
    templateUrl: './contextual-menu.component.html',
    styleUrls: ['./contextual-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextualMenuComponent extends FieldType {
    public isVisible$ = new BehaviorSubject<boolean>(false);

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            label: 'NO_LABEL_GIVEN',
            click: () => { throw new Error('You must give a "click" callback into the "templateOptions"'); },
            buttonClassName: 'button -secondary -icon -right -s'
        }
    };

    clickItem(itemClicked: any, groupLabel: string = null) {
        this.to.click(this.field, {value: itemClicked.value, group: groupLabel });
        this.isVisible$.next(false);
    }

    toggleMenu() {
        this.isVisible$.next(!this.isVisible$.getValue());
    }

    close() {
        this.isVisible$.next(false);
    }
}
