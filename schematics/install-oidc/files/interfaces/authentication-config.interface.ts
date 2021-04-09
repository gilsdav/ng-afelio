import { InjectionToken } from '@angular/core';
import { AuthConfig } from 'angular-oauth2-oidc';

export const AUTHENTICATION_CONFIG = new InjectionToken<AuthenticationConfig>('authentication-config');

export type AuthenticationConfig = AuthConfig & {
    realm: string,
    clientId: string,
    redirectUri: string,
    authErrorRoute: string,
    completeSecure?: boolean,
    storage?: 'session' | 'local'
};
