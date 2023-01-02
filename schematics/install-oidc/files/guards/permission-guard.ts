import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';

/**
 * Guard that take a list of permissions to compare with user token.
 *
 * Permissions as to be declared into data section of route.
 * ```ts
 * { path:..., canActivate: [ PermissionGuard ] data: { permissions: [...], unauthorizedRedirect: '...' } ... }
 * ```
 *
 * *Usage similar to canAccess directive.*
 */
@Injectable()
export class PermissionGuard implements CanActivate, CanActivateChild, CanLoad {

    constructor(private authService: AuthenticationService, private router: Router) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.checkPermissions(next);
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.checkPermissions(childRoute);
    }

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
        return this.checkPermissions(route);
    }

    private checkPermissions(route: ActivatedRouteSnapshot | Route): Observable<boolean> {
        const permissions: string[] = route.data && route.data['permissions'];
        return this.authService.canAccess(permissions).pipe(
            tap(canAccess => {
                if (!canAccess && (route.data && route.data['unauthorizedRedirect'])) {
                    this.router.navigateByUrl(route.data['unauthorizedRedirect']);
                }
            })
        );
    }

}
