import { StatisticalDistrictDto } from '@fcsd-daenae/TerritoryApi';
import { CompleteNis } from './complete-nis.model';

export class StatisticalDistrict {
    nis5: CompleteNis;
    nis6: CompleteNis;
    nis9: CompleteNis;

    constructor(base?: Partial<StatisticalDistrict>) {
        if (base) {
            Object.assign(this, base);
        }
    }

    public static fromDto(dto: StatisticalDistrictDto): StatisticalDistrict {
        if (!dto) {
            return null;
        }

        return new StatisticalDistrict({
            nis5: CompleteNis.fromDto(dto.nis5),
            nis6: CompleteNis.fromDto(dto.nis6),
            nis9: CompleteNis.fromDto(dto.nis9)
        });
    }

}
