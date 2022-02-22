import { Rule, SchematicsException, Tree, chain, externalSchematic } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateName } from '@schematics/angular/utility/validation';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';

import { addIntoIndex } from '../util/barrel';

import { Schema as ComponentOptions } from './schema';

export default function(options: ComponentOptions): Rule {
    return async (host: Tree) => {

        if (!options.project) {
            throw new SchematicsException('Option (project) is required.');
        }

        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);
        if (project && options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        const parsedPath = parseName(options.path as string, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;

        validateName(options.name);

        const angularOptions = { ...options };
        delete angularOptions.barrel;

        return chain([
            externalSchematic('@schematics/angular', 'component', angularOptions),
            addIntoIndex(options.path, options, 'component'),
        ]);
    };
}
