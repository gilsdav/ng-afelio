import { DS_IconsEnum } from '../enums/ds-icons.enum';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class DS_IconService {

  private iconSet: { [key in DS_IconsEnum]?: TrustedHTML } = {};

  constructor(private http: HttpClient) { }

  public getIcon(icon: DS_IconsEnum): Observable<TrustedHTML> {
    if (this.iconSet[icon]) {
      return of(this.iconSet[icon]!);
    } else {
      const iconName = icon.toString().substring(5);
      return this.http.get(`/assets/pictures/icons/${iconName}.svg`, { responseType: 'text' }).pipe(
        map(svg => trustedHTMLFromString(svg)),
        tap(trustedHtml => this.iconSet[icon] = trustedHtml)
      );
    }
  }
}

let policy: TrustedTypePolicy | null | undefined;

function getPolicy(): TrustedTypePolicy | null {
  if (policy === undefined) {
    policy = null;
    if (typeof window !== 'undefined') {
      const ttWindow = window as unknown as { trustedTypes?: TrustedTypePolicyFactory };
      if (ttWindow.trustedTypes !== undefined) {
        policy = ttWindow.trustedTypes.createPolicy('angular#components', {
          createHTML: (s: string) => s,
        });
      }
    }
  }
  return policy;
}

export function trustedHTMLFromString(html: string): TrustedHTML {
  return getPolicy()?.createHTML(html) || html as unknown as TrustedHTML;
}

export declare interface TrustedHTML {
  __brand__: 'TrustedHTML';
}

export declare interface TrustedTypePolicyFactory {
  createPolicy(policyName: string, policyOptions: {
    createHTML?: (input: string) => string,
  }): TrustedTypePolicy;
}

export declare interface TrustedTypePolicy {
  createHTML(input: string): TrustedHTML;
}
