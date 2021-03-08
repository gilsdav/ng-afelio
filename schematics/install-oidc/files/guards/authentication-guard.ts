import {
    ActivatedRouteSnapshot,
    CanActivateChild,
    RouterStateSnapshot,
    CanActivate,
    Router
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../../../../environments/environment';

/**
 * Use this Guard to make sure that user is connected to access to a route.
 * Will redirect to Identity provider if not connected.
 *
 * Only needed if `environment.oidc.completeSecure` is set to `false`
 *
 * You can set `environment.oidc.authErrorRoute` to redirect to an error page in authentication error case.
 */
@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
    constructor(private authService: AuthenticationService, private router: Router) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.canNavigate(state.url);
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.canNavigate(state.url);
    }

    private canNavigate(path: string): Observable<boolean>  {
        return this.authService.getTokenAsync(true, path).pipe(
            filter(token => !!token),
            map(() => {
                // Clean Auth parameters
                setTimeout(() => {
                    const href = location.href
                        .replace(/[&\?]code=[^&\$]*/, '')
                        .replace(/[&\?]scope=[^&\$]*/, '')
                        .replace(/[&\?]state=[^&\$]*/, '')
                        .replace(/[&\?]session_state=[^&\$]*/, '');
                    history.replaceState(null, window.name, href);
                });
                return true;
            }),
            catchError(() => {
                if (environment.oidc.authErrorRoute) {
                    this.router.navigate([environment.oidc.authErrorRoute]);
                }
                return of(false);
            })
        );
    }

}
