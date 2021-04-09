import {
    ActivatedRouteSnapshot,
    CanActivateChild,
    RouterStateSnapshot,
    CanActivate,
    Router
} from '@angular/router';
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';
import { AuthenticationConfig, AUTHENTICATION_CONFIG } from '../interfaces/authentication-config.interface';

/**
 * Use this Guard to make sure that user is connected to access to a route.
 * Will redirect to Identity provider if not connected.
 *
 * Only needed if `environment.oidc.completeSecure` is set to `false`
 *
 * You can set `environment.oidc.authErrorRoute` to redirect to an error page in authentication error case.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate, CanActivateChild {
    constructor(
        private authService: AuthenticationService,
        private router: Router,
        @Inject(AUTHENTICATION_CONFIG) private config: AuthenticationConfig
    ) {}

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
                if (this.config.authErrorRoute) {
                    this.router.navigate([this.config.authErrorRoute]);
                }
                return of(false);
            })
        );
    }

}
