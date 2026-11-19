import { Path, join } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree, branchAndMerge, chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import ts = require('typescript');

import { buildDefaultPath, buildEnvironmentsPath, buildProjectSrcPath, getLatestVersion, resolveProjectFile } from '../util';
import { addImportToModule, addProviderToConfig, insertImport } from '../util/ast-util';
import { Change, applyChangesToHost } from '../util/change';
import { appendIntoEnvironment } from '../util/environment';

import { Schema as StoreOptions } from './schema';

function installNgxs(ngxsVersion: string, ngxsDevtoolsVersion: string): Rule {
    return (host: Tree, context: SchematicContext) => {
        const lib: NodeDependency = {
            type: NodeDependencyType.Default,
            name: '@ngxs/store',
            version: `^${ngxsVersion}`,
            overwrite: false,
        };
        const plugin: NodeDependency = {
            type: NodeDependencyType.Dev,
            name: '@ngxs/devtools-plugin',
            version: `^${ngxsDevtoolsVersion}`,
            overwrite: false,
        };
        addPackageJsonDependency(host, lib);
        addPackageJsonDependency(host, plugin);
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function applyModuleImports(projectSrcPath: string, projectAppPath: string, environmentsPath: string, options: StoreOptions, isModuleMode: boolean): Rule {
    return host => {
        const modulePath = isModuleMode ? resolveProjectFile(host, projectSrcPath, projectAppPath, options.appModule) : undefined;
        const configPath = isModuleMode ? undefined : (options.appConfig ? resolveProjectFile(host, projectSrcPath, projectAppPath, options.appConfig) : undefined);

        if (isModuleMode && modulePath) {
            const changes: Change[] = [];
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
            changes.push(insertImport(source, modulePath, 'environment', buildRelativePath(modulePath, join(environmentsPath as Path, 'environment'))));
            // Add ng imports
            const translateImport = `NgxsModule.forRoot([], {
            developmentMode: environment.ngxsDebugger
        })`;
            const pluginImport = `...(!environment.ngxsDebugger ? [] : [
            NgxsReduxDevtoolsPluginModule.forRoot()
        ])`;
            changes.push(...addImportToModule(source, modulePath, translateImport, null as any));
            changes.push(...addImportToModule(source, modulePath, pluginImport, null as any));
            // Save changes
            applyChangesToHost(host, modulePath, changes);
        } else if (configPath) {
            const changes: Change[] = [];
            const text = host.read(configPath);
            if (!text) {
                throw new SchematicsException(`Config file at ${configPath} does not exist.`);
            }
            const sourceText = text.toString('utf8');
            const source = ts.createSourceFile(
                configPath,
                sourceText,
                ts.ScriptTarget.Latest,
                true
            );
            // Add ts imports
            changes.push(insertImport(source, configPath, 'provideStore', '@ngxs/store'));
            changes.push(insertImport(source, configPath, 'withNgxsReduxDevtoolsPlugin', '@ngxs/devtools-plugin'));
            changes.push(insertImport(source, configPath, 'environment', buildRelativePath(configPath, join(environmentsPath as Path, 'environment'))));
            // Add ng imports
            const storeProvider = `provideStore(
            [],
            withNgxsReduxDevtoolsPlugin({ disabled: !environment.enableStoreDebug })
        )`;
            changes.push(...addProviderToConfig(source, configPath, storeProvider, null as any));
            // Save changes
            applyChangesToHost(host, configPath, changes);
        }
        return host;
    };
}

// function getEnvironmentNode(source: ts.SourceFile): ts.Node | undefined {
//     const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);
//     for (const keyword of keywords) {
//         if (ts.isVariableStatement(keyword)) {
//             const [declaration] = keyword.declarationList.declarations;
//             if (
//                 ts.isVariableDeclaration(declaration) &&
//                 declaration.initializer &&
//                 declaration.name.getText() === 'environment'
//             ) {
//                 return declaration.initializer.getChildAt(1);
//             }
//         }
//     }
// }

function applyIntoEnvironment(environmentsPath: string, projectName: string): Rule {
    return chain([
        appendIntoEnvironment(environmentsPath, projectName, `\n    enableStoreDebug: true`, 'enableStoreDebug:', false),
        appendIntoEnvironment(environmentsPath, projectName, `\n    enableStoreDebug: false`, 'enableStoreDebug:', true)
    ]);
    // let projectEnvPath = join(projectAppPath as Path, '../environments/environment.development.ts');
    // return host => {
    //     let text = host.read(projectEnvPath);
    //     if (!text) { // Fallback for old project version
    //         projectEnvPath = join(projectAppPath as Path, '../environments/environment.ts');
    //         text = host.read(projectEnvPath);
    //     }
    //     if (!text) {
    //         throw new SchematicsException(`Environment file on ${projectName} project does not exist.`);
    //     }
    //     const sourceText = text.toString('utf8');
    //     const source = ts.createSourceFile(
    //         projectEnvPath,
    //         sourceText,
    //         ts.ScriptTarget.Latest,
    //         true
    //     );
    //     const node = getEnvironmentNode(source);
    //     const changes: Change[] = [];
    //     if (node) {
    //         if (!node.getText().includes('ngxsDebugger:')) {
    //             const lastRouteNode = node.getLastToken();
    //             const envToAdd = `\n    ngxsDebugger: true`;
    //             if (lastRouteNode) {
    //                 changes.push(
    //                     new InsertChange(
    //                         projectEnvPath,
    //                         lastRouteNode.getEnd(),
    //                         `,${envToAdd}`
    //                     )
    //                 );
    //             } else {
    //                 changes.push(
    //                     new InsertChange(
    //                         projectEnvPath,
    //                         node.getEnd(),
    //                         `${envToAdd}\n`
    //                     )
    //                 );
    //             }
    //             console.log(`${colors.green('Changes will be applied to dev environment.')} ${colors.yellow('Please apply it to others.')}`);
    //         }
    //     } else {
    //         throw new SchematicsException(`No "export const environment" found`);
    //     }
    //     applyChangesToHost(host, projectEnvPath, changes);
    //     return host;
    // };
}

export default function (options: StoreOptions): Rule {
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

        const environmentsPath = buildEnvironmentsPath(project);

        const isModuleMode = !!options.appModule && !!resolveProjectFile(host, buildProjectSrcPath(project), projectAppPath, options.appModule);

        const ngxsVersion = await getLatestVersion('@ngxs/store');
        const ngxsDevtoolsVersion = await getLatestVersion('@ngxs/devtools-plugin');

        return chain([
            branchAndMerge(
                chain([
                    installNgxs(ngxsVersion, ngxsDevtoolsVersion),
                    applyIntoEnvironment(environmentsPath, options.project),
                    applyModuleImports(buildProjectSrcPath(project), projectAppPath, environmentsPath, options, isModuleMode),
                ])
            ),
        ]);
    };
}
