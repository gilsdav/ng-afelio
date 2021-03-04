import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { map, skipWhile, skip, shareReplay, filter, switchMap } from 'rxjs/operators';

import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

import { environment } from '../../../../../environments/environment';

export interface UserInfo {
    userName: string;
    firstName: string;
    lastName: string;
    roles: string[];
}

@Injectable()
export class AuthenticationService {
    private tokenSubject = new BehaviorSubject<string | null>(null);
    public userInfos$ = this.tokenSubject.pipe(
        filter(token => token !== null),
        map(() => {
            const claims: any = this.oauthService.getIdentityClaims();
            const roles: string[] = claims?.resource_access?.[environment.oidc.clientId]?.roles ?
                claims?.resource_access?.[environment.oidc.clientId]?.roles :
                [];
            const userInfo: UserInfo = {
                userName: claims.preferred_username,
                firstName: claims.given_name,
                lastName: claims.family_name,
                roles
            };
            return userInfo;
        }),
        shareReplay(1)
    );

    constructor(
        private oauthService: OAuthService
    ) { }

    public getToken(): string {
        return this.oauthService.getAccessToken();
    }


    public getTokenAsync(): Observable<string> {
        if (this.oauthService.hasValidAccessToken()) {
            return this.tokenSubject.asObservable() as Observable<string>;
        } else if (this.tokenSubject.getValue() === null) {
            return this.tokenSubject.pipe(skip<string | null>(1)) as Observable<string>;
        } else {
            this.refresh();
            return this.tokenSubject.pipe(skipWhile<string | null>(() => this.oauthService.hasValidAccessToken())) as Observable<string>;
        }
    }


    public initAuthentication(): Promise<any> {
        const isRoot = location.pathname === '/';
        const redirectUri = isRoot ? environment.oidc.redirectUri : location.href.split(/[?;]/)[0]; // Remove query params
        const config = {
            ...environment.oidc,
            redirectUri,
            issuer: environment.oidc.issuer
        };

        const login = (realm: string) => {
            const tempConfig: AuthConfig = {
                ...config,
                issuer: `${config.issuer}/${realm}`
            };
            this.oauthService.configure(tempConfig);
            return from(this.oauthService.loadDiscoveryDocumentAndLogin());
        };

        const loginOrchestration$ = login(environment.oidc.realm).pipe(
            switchMap(isLogged => {
                if (isLogged) {
                    this.tokenSubject.next(this.getToken());
                    return of(true);
                } else {
                    this.tokenSubject.next(null);
                    return throwError(false);
                }
            })
        );

        return loginOrchestration$.toPromise();
    }

    public refresh(): Promise<any> {
        return this.oauthService.refreshToken().then(
            tokenResponse => {
                this.tokenSubject.next(tokenResponse.access_token);
            },
            () => {
                this.tokenSubject.next(null);
            }
        );
    }

    public canAccess(permissionsToCheck: string[]): Observable<boolean> {
        if (!permissionsToCheck || permissionsToCheck.length === 0) {
            return of(true);
        } else {
            return this.userInfos$.pipe(
                map(userInfos => {
                    return this.checkPermissions(userInfos.roles, permissionsToCheck);
                })
            );
        }
    }

    private checkPermissions(currentPermissions: string[], permissionsToCheck: string[]): boolean {
        return !!permissionsToCheck.find(na => {
            return !!currentPermissions.find(a => a === na);
        });
    }

}
