import { Path, join } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree, branchAndMerge, chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import ts = require('typescript');

import { addImportToModule, insertImport } from '../util/ast-util';
import { Change, applyChangesToHost } from '../util/change';

import { Schema as StoreOptions } from './schema';

function installNgxs(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const lib: NodeDependency = {
            type: NodeDependencyType.Default,
            name: '@ngxs/store',
            version: '^3.7.1',
            overwrite: false,
        };
        const plugin: NodeDependency = {
            type: NodeDependencyType.Dev,
            name: '@ngxs/devtools-plugin',
            version: '^3.7.1',
            overwrite: false,
        };
        addPackageJsonDependency(host, lib);
        addPackageJsonDependency(host, plugin);
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function applyModuleImports(projectAppPath: string, options: StoreOptions): Rule {
    return host => {
        if (options.appModule) {
            const changes: Change[] = [];
            const modulePath = join(projectAppPath as Path, options.appModule);
            const text = host.read(modulePath);
            if (!text) {
                throw new SchematicsException(`Module file at ${modulePath} does not exist.`);
            }
            const sourceText = text.toString('utf8');
            const source = ts.createSourceFile(
                modulePath,
                sourceText,
                ts.ScriptTarget.Latest,
                true
            );
            // Add ts imports
            changes.push(insertImport(source, modulePath, 'NgxsModule', '@ngxs/store'));
            changes.push(insertImport(source, modulePath, 'NgxsReduxDevtoolsPluginModule', '@ngxs/devtools-plugin'));
            changes.push(insertImport(source, modulePath, 'environment', '../environments/environment'));
            // Add ng imports
            const translateImport = `NgxsModule.forRoot([], {
            developmentMode: !environment.production
        })`;
            const pluginImport = `...(environment.production ? [] : [
            NgxsReduxDevtoolsPluginModule.forRoot()
        ])`;
            changes.push(...addImportToModule(source, modulePath, translateImport, null as any));
            changes.push(...addImportToModule(source, modulePath, pluginImport, null as any));
            // Save changes
            applyChangesToHost(host, modulePath, changes);
        }
        return host;
    };
}

export default function(options: StoreOptions): Rule {
    return async (host: Tree) => {
        if (!options.project) {
            throw new SchematicsException('Option (project) is required.');
        }

        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectAppPath: string;
        if (project) {
            projectAppPath = buildDefaultPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        return chain([
            branchAndMerge(
                chain([
                    installNgxs(),
                    applyModuleImports(projectAppPath, options),
                ])
            ),
        ]);
    };
}
