import { Injectable } from '@angular/core';
import { StatisticalDistrictServiceGen } from '@fcsd-daenae/TerritoryApi';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatisticalDistrict } from '../models/statistical-district.model';

@Injectable()
export class StatisticalDistrictService {

    constructor(
        private statisticalDistrictServiceGen: StatisticalDistrictServiceGen
    ) {}

    public getStatisticalDistrictByNis9Code(nis9Code: string): Observable<StatisticalDistrict> {
        return this.statisticalDistrictServiceGen.getStatisticalDistrictByNis9Code({
            nis9Code
        }).pipe(
            map(s => StatisticalDistrict.fromDto(s))
        );
    }
}
