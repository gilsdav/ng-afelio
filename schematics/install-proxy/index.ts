import { strings } from '@angular-devkit/core';
import { apply, branchAndMerge, chain, mergeWith, move, Rule, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { WorkspaceDefinition, getWorkspace, updateWorkspace } from '@schematics/angular/utility/workspace';

import { buildProjectSrcPath } from '../util';

// import { appendIntoEnvironment } from '../util/environment';

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
    });
}


export default function (options: ProxyOptions): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectSrcPath: string;
        if (project) {
            projectSrcPath = buildProjectSrcPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        const templateSource = apply(url('./files'), [
            template({
                ...strings,
                ...options,
            }),
            move(projectSrcPath),
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
