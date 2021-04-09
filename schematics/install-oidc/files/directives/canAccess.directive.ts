import { Directive, TemplateRef, ViewContainerRef, Input } from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';

import { AuthenticationService } from '../services/authentication.service';

/**
 * NgIf that take a list of permissions to compare with user token.
 *
 * Usage: `<ng-container [canAccess]="[...]" >...</ng-container>"`
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[canAccess]'
})
export class CanAccessDirective {

    constructor(
        private authService: AuthenticationService,
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef
    ) {}

    @Input() set canAccess(permissionsNeeded: string[] | string) {
        this.compareAccess(permissionsNeeded).pipe(
            untilDestroyed(this)
        ).subscribe(canAccess => {
            if (canAccess) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            } else {
                this.viewContainer.clear();
            }
        });
    }

    private compareAccess(neededAccess: string[] | string): Observable<boolean> {
       return this.authService.canAccess((neededAccess instanceof Array) ? neededAccess : [neededAccess]);
    }
}
