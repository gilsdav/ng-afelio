import { join, Path, strings } from '@angular-devkit/core';
import { apply, branchAndMerge, chain, mergeWith, move, Rule, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { getWorkspace, updateWorkspace, WorkspaceDefinition } from '@schematics/angular/utility/workspace';

// import { appendIntoEnvironment } from '../util/environment';
import { buildDefaultPath } from '../util';

import { Schema as ProxyOptions } from './schema';

function updateConfig(): Rule {
    return updateWorkspace((workspace: WorkspaceDefinition) => {
        for (const [, project] of workspace.projects) {
            for (const [name, target] of project.targets) {
                if (name === 'serve') {
                    if (!target.options) {
                        target.options = {};
                    }
                    target.options['proxyConfig'] = 'src/proxy.conf.json';
                }
            }
        }
        if (!workspace.extensions['cli']) {
            workspace.extensions['cli'] = {};
        }
        (workspace.extensions['cli'] as any)['schematicCollections'] = [
            'ng-afelio',
            '@schematics/angular'
        ];
    });
}


export default function (options: ProxyOptions): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectAppPath: string;
        if (project) {
            projectAppPath = buildDefaultPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        const templateSource = apply(url('./files'), [
            template({
                ...strings,
                ...options,
            }),
            move(join(projectAppPath as Path, '..')),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    mergeWith(templateSource),
                    updateConfig()
                ])
            ),
        ]);
    };
}
