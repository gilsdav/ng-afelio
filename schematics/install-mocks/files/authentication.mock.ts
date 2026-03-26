import { Provider } from '@angular/core';
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';

class SecurityStorageStub implements Partial<AbstractSecurityStorage> {
    read(key: string) {
        return `{
                "access_token_expires_at": 1908429751000,
                "authzData": "token",
                "authnResult": {
                    "id_token": "token"
                }
        }`;
    }
    write(key: string, value: any): void {}
}

export const mockAuthenticationProviders: Provider[] = [
    {
        provide: AbstractSecurityStorage,
        useClass: SecurityStorageStub
    }
];
