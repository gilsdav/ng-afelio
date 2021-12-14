import { Rule, chain, externalSchematic } from '@angular-devkit/schematics';

import { Schema as ComponentOptions } from './schema';

export default function(options: ComponentOptions): Rule {
    return async () => {
        return chain([
            externalSchematic('@schematics/angular', 'component', options),
        ]);
    };
}
