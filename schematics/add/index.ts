import { strings } from '@angular-devkit/core';
import { WorkspaceDefinition } from '@angular-devkit/core/src/workspace';
import { apply, branchAndMerge, chain, MergeStrategy, mergeWith, move, Rule, schematic, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { updateWorkspace } from '@schematics/angular/utility/workspace';
import { Schema as AddOptions } from './schema';


// function installNgxBuildPlus(mustApplyInstall: boolean): Rule {
//     return (host: Tree, context: SchematicContext) => {
//         const builder: NodeDependency = {
//             type: NodeDependencyType.Dev,
//             name: 'ngx-build-plus',
//             version: '^10.1.1',
//             overwrite: true,
//         };
//         const untilDestroy: NodeDependency = {
//             type: NodeDependencyType.Default,
//             name: '@ngneat/until-destroy',
//             version: '^8.0.3',
//             overwrite: true,
//         };
//         addPackageJsonDependency(host, builder);
//         addPackageJsonDependency(host, untilDestroy);
//         if (mustApplyInstall) {
//             context.addTask(new NodePackageInstallTask(), []);
//         }
//     };
// }

function updateConfig(): Rule {
    // function setOption(target: TargetDefinition) {
    //     if (!target.options) {
    //         target.options = {};
    //     }
    //     target.options['plugin'] = 'ng-afelio/builders/plugin.js';
    // }
    return updateWorkspace((workspace: WorkspaceDefinition) => {
        // for (const [, project] of workspace.projects) {
        //     for (const [name, target] of project.targets) {
        //         switch (name) {
        //             case 'build':
        //                 target.builder = 'ngx-build-plus:browser';
        //                 setOption(target);
        //                 break;
        //             case 'serve':
        //                 target.builder = 'ngx-build-plus:dev-server';
        //                 setOption(target);
        //                 break;
        //             case 'test':
        //                 target.builder = 'ngx-build-plus:karma';
        //                 setOption(target);
        //                 break;
        //             default:
        //                 break;
        //         }
        //     }
        // }
        if (!workspace.extensions['cli']) {
            workspace.extensions['cli'] = {};
        }
        (workspace.extensions['cli'] as any)['schematicCollections'] = [
            'ng-afelio',
            '@schematics/angular'
        ];
    });
}

function updateScripts(): Rule {
    return (host: Tree) => {
        const packageFile = '/package.json';
        const text = host.read(packageFile);
        if (!text) {
            throw new SchematicsException(`Can not find "package.json" file in your project.`);
        }
        const sourceText = text.toString('utf8');
        const toInsert = `"start": "ng-afelio start"`;
        const alreadyInstalled = sourceText.indexOf(toInsert) !== -1;
        if (!alreadyInstalled) {
            const toReplaceMatch = sourceText.match(/"start": "(.+)"/);
            if (toReplaceMatch) {
                const jsonContent = JSON.parse(sourceText);
                jsonContent.scripts['ng-afelio'] = 'ng-afelio';
                jsonContent.scripts['start'] = 'ng-afelio serve';
                jsonContent.scripts['build'] = 'ng-afelio build';
                host.overwrite(packageFile, JSON.stringify(jsonContent, null, 2));
            }
        }
        return host;
    };
}

export default function (options: AddOptions): Rule {
    return async (host: Tree) => {
        // const workspace = await getWorkspace(host);
        // const project = workspace.projects.get(options.project);

        // if (!project) {
        //     throw new SchematicsException(`Project "${options.project}" not found.`);
        // }

        const templateSource = apply(url('./files'), [
            template({
                ...strings,
                ...options,
            }),
            move('/'),
        ]);

        const templateConfigSource = apply(url('../../templates/config'), [
            move('/'),
        ]);

        const uiKitToInstall = options.uiKit && options.uiKit !== 'none';

        return chain([
            branchAndMerge(
                chain([
                    mergeWith(templateConfigSource),
                    mergeWith(templateSource, MergeStrategy.Overwrite),
                    // installNgxBuildPlus(!uiKitToInstall),
                    updateConfig(),
                    updateScripts(),
                    ...(uiKitToInstall ? [
                        schematic('install-uikit', { type: options.uiKit }),
                    ] : []),
                ])
            ),
        ]);
    };
}
