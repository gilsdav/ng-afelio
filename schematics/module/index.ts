import { strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, noop, template, url } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateName } from '@schematics/angular/utility/validation';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';

import { Schema as ModuleOptions } from './schema';

export default function(options: ModuleOptions): Rule {
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

        const templateSource = apply(url('./files'), [
            options.guards ? noop() : filter(p => !p.includes('/guards/')),
            options.pipes ? noop() : filter(p => !p.includes('/pipes/')),
            options.stores ? noop() : filter(p => !p.includes('/stores/')),
            template({
              ...strings,
              'if-flat': (s: string) => (options.flat ? '' : s),
              ...options,
            }),
            move(parsedPath.path),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    mergeWith(templateSource),
                ])
            ),
        ]);
    };
}
