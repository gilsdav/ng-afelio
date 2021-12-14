import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { isObservable } from 'rxjs';

/**
 * This pipe allow you to translate multiple keys in a simple string.
 *
 * Usage:
 * `'Un test MY.KEY1 MY.KEY2' | smartTranslate:{param1: 'value1'}`
 */
@Pipe({
    name: 'smartTranslate',
    pure: false
})
export class SmartTranslatePipe extends TranslatePipe implements PipeTransform {

    constructor(private translateService: TranslateService, private cdr: ChangeDetectorRef) {
        super(translateService, cdr);
    }

    protected lastKeys: string[];

    updateValue(key: string, interpolateParams?: Object, translations?: any): void {
        const onTranslation = (res: {[key: string]: string}) => {
            this.value = this.lastKeys.reduce((result, k) => result.replace(k, res[k]), key);
            this.lastKey = key;
            this.cdr.markForCheck();
        };
        if (translations) {
            const res = this.translateService.getParsedResult(translations, this.lastKeys, interpolateParams);
            if (isObservable(res.subscribe)) {
                res.subscribe(onTranslation);
            } else {
                onTranslation(res);
            }
        }
        this.translateService.get(this.lastKeys, interpolateParams).subscribe(onTranslation);
    }

    transform(query: string, ...args: any[]): any {
        if (!query || !query.length) {
            return query;
        }
        this.lastKeys = query.match(/((?:[A-Z0-9_])+(?:\.[A-Z0-9_]+)+)/g);
        if (!this.lastKeys || !this.lastKeys.length) {
            return query;
        }
        return super.transform(query, ...args);
    }

}
