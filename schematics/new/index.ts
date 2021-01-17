import { Rule, chain, externalSchematic, schematic } from '@angular-devkit/schematics';

import { Schema as NewOptions } from './schema';

export default function(options: NewOptions): Rule {
    const { ['uiKit']: uiKit, ...newOptions } = options;
    return async () => {
        return chain([
            externalSchematic('@schematics/angular', 'ng-new', newOptions),
            schematic('ng-add', { uiKit : uiKit ? uiKit : 'none' }),
        ]);
    };
}
