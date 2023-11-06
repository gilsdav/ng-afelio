import { Directive, TemplateRef, ViewContainerRef, Input, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';

/**
 * NgIf that take a list of permissions to compare with user token.
 *
 * Usage: `<ng-container *canAccess="[...]" >...</ng-container>"`
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[canAccess]'
})
export class CanAccessDirective implements OnDestroy {

    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthenticationService,
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef
    ) {}

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    @Input() set canAccess(permissionsNeeded: string[] | string) {
        this.compareAccess(permissionsNeeded).pipe(
            takeUntil(this.destroy$)
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
