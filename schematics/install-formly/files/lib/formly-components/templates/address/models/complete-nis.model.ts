import { CompleteNisDto } from '@fcsd-daenae/TerritoryApi';

export class CompleteNis {

    code: string;
    name: string;

    constructor(base?: Partial<CompleteNis>) {
        if (base) {
            Object.assign(this, base);
        }
    }

    public static fromDto(dto: CompleteNisDto): CompleteNis {
        if (!dto) {
            return null;
        }

        return new CompleteNis({
            code: dto.code,
            name: dto.name
        });
    }

    public toDto(): CompleteNisDto {
        return {
            code: this.code,
            name: this.name
        };
    }

}
