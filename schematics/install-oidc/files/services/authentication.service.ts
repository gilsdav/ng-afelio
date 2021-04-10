import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { map, skipWhile, skip, shareReplay, filter, switchMap, catchError } from 'rxjs/operators';

import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

import { AuthenticationConfig, AUTHENTICATION_CONFIG } from '../interfaces/authentication-config.interface';

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
            const roles: string[] = claims?.resource_access?.[this.config.clientId]?.roles ?
                claims?.resource_access?.[this.config.clientId]?.roles :
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
        private oauthService: OAuthService,
        @Inject(AUTHENTICATION_CONFIG) private config: AuthenticationConfig
    ) { }

    public getToken(): string {
        return this.oauthService.getAccessToken();
    }


    public getTokenAsync(loggin = false, redirectPath?: string): Observable<string> {
        if (this.tokenSubject.getValue() === null) {
            if (loggin) {
                this.initAuthentication(true, redirectPath);
            }
            return this.tokenSubject.pipe(skip<string | null>(1)) as Observable<string>;
        } else if (this.oauthService.hasValidAccessToken()) {
            return this.tokenSubject.asObservable() as Observable<string>;
        } else {
            this.refresh();
            return this.tokenSubject.pipe(skipWhile<string | null>(() => this.oauthService.hasValidAccessToken())) as Observable<string>;
        }
    }


    public initAuthentication(loggin = false, redirectPath?: string): Promise<any> {
        const isRoot = location.pathname === '/';
        let redirectUri: string;
        if (redirectPath) {
            redirectUri = `${location.origin}${redirectPath.split(/[?;]/)[0]}`;
        } else {
            redirectUri = isRoot ? this.config.redirectUri : location.href.split(/[?;]/)[0]; // Remove query params
        }
        const config = {
            ...this.config,
            redirectUri,
            issuer: this.config.issuer
        };

        const configure = (realm: string) => {
            const tempConfig: AuthConfig = {
                ...config,
                issuer: `${config.issuer}/${realm}`
            };
            this.oauthService.configure(tempConfig);
        };

        // const loadDocuments = (realm: string) => {
        //     configure(realm);
        //     return from(this.oauthService.loadDiscoveryDocument());
        // };

        const login = (realm: string) => {
            configure(realm);
            return from(this.oauthService.loadDiscoveryDocumentAndLogin());
        };

        if (this.config.completeSecure || loggin) {
            const loginOrchestration$ = login(this.config.realm).pipe(
                switchMap(isLogged => {
                    if (isLogged) {
                        this.tokenSubject.next(this.getToken());
                        this.oauthService.setupAutomaticSilentRefresh();
                        return of(true);
                    } else {
                        this.tokenSubject.next(null);
                        return throwError(false);
                    }
                }),
                catchError((error) => {
                    console.log('err', error);
                    this.tokenSubject.error(error);
                    return throwError(false);
                })
            );
            return loginOrchestration$.toPromise();
        } else {
            // return loadDocuments(this.config.realm).toPromise();
            return Promise.resolve(true);
        }
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

    public logout(): void {
        this.oauthService.logOut();
    }

    private checkPermissions(currentPermissions: string[], permissionsToCheck: string[]): boolean {
        return !!permissionsToCheck.find(na => {
            return !!currentPermissions.find(a => a === na);
        });
    }

}
