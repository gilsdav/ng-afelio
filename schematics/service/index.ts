import { Rule, SchematicsException, Tree, chain, externalSchematic } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';

import { relativeCwdFromRelativeProjectPath, addIntoIndex } from '../util/barrel';
import { validateName } from '../util/validation';

import { Schema as ServiceOptions } from './schema';

export default function(options: ServiceOptions): Rule {
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
        options.path = relativeCwdFromRelativeProjectPath(parsedPath.path);

        validateName(options.name);

        const angularOptions = { ...options };
        delete angularOptions.barrel;

        return chain([
            externalSchematic('@schematics/angular', 'service', angularOptions),
            addIntoIndex(options.path, options, 'service'),
        ]);
    };
}
