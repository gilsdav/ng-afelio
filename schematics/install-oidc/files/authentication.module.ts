import { Inject, ModuleWithProviders, NgModule, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { OAuthService, OAuthStorage } from 'angular-oauth2-oidc';

import { AuthenticationService } from './services/authentication.service';
import { authenticationInterceptorProvider } from './interceptors/authentication.interceptor';
import { authenticationInitializerProvider } from './initializers/authentication.initializer';
import { AuthenticationGuard } from './guards/authentication-guard';
import { PermissionGuard } from './guards/permission-guard';
import { CanAccessDirective } from './directives/canAccess.directive';
import { AuthenticationConfig, AUTHENTICATION_CONFIG } from './interfaces/authentication-config.interface';

export function storageFactory(config?: AuthenticationConfig): OAuthStorage {
    if (config && config.storage === 'local') {
        return localStorage;
    } else {
        return sessionStorage;
    }
}

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        CanAccessDirective
    ],
    exports: [
        CanAccessDirective
    ]
})
export class AuthenticationModule {

    public static forRoot(config?: AuthenticationConfig): ModuleWithProviders<AuthenticationModule> {
        return {
            ngModule: AuthenticationModule,
            providers: [
                AuthenticationService,
                authenticationInterceptorProvider,
                authenticationInitializerProvider,
                PermissionGuard,
                AuthenticationGuard,
                { provide: AUTHENTICATION_CONFIG, useValue: config },
                { provide: OAuthStorage, useFactory: storageFactory, deps: [ AUTHENTICATION_CONFIG ] }
            ]
        };
    }

    public static forChild(): ModuleWithProviders<AuthenticationModule> {
        return {
            ngModule: AuthenticationModule
        };
    }

    constructor(
        // @Optional() @SkipSelf() parentModule: AuthenticationModule,
        @Optional() http: HttpClient,
        @Optional() oauthService: OAuthService,
        @Optional() @Inject(AUTHENTICATION_CONFIG) config: AuthenticationConfig
    ) {
        // if (parentModule) {
        //     throw new Error('AuthenticationModule is already loaded. Import in your base AppModule only.');
        // }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
        if (!oauthService) {
            throw new Error('You need to import the OAuthModule.forRoot() in your AppModule! \n' +
            'See also https://github.com/manfredsteyer/angular-oauth2-oidc#importing-the-ngmodule');
        }
        if (!config) {
            throw new Error('You need to import the AuthenticationModule.forRoot(environment.oidc) ' +
            'or import AuthenticationModule and add provider { provide: AUTHENTICATION_CONFIG, useValue: environment.oidc } in your AppModule!');
        }
    }
}
