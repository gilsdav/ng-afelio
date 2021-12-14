import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';

@Pipe({name: 'asObservable'})
export class AsObservablePipe implements PipeTransform {
    transform(value: any): Observable<any> {
        if (!(value instanceof Observable)) {
            value = of(value);
        }
        return value;
    }
}
