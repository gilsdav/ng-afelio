import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree, apply, branchAndMerge, chain, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { WorkspaceDefinition, getWorkspace, updateWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';

import { buildDefaultPath } from '../util';
import { addImportToModule, addProviderToConfig, insertImport } from '../util/ast-util';
import { Change, InsertChange, applyChangesToHost } from '../util/change';
import { appendIntoEnvironment } from '../util/environment';

import { Schema as ErrorHandlerOptions } from './schema';

const buildPath = './core';

function installNgxToastr(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const ngxToastr: NodeDependency = {
            type: NodeDependencyType.Default,
            name: 'ngx-toastr',
            version: '^20.0.5',
            overwrite: false,
        };
        addPackageJsonDependency(host, ngxToastr);
        context.addTask(new NodePackageInstallTask(), []);
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

function applyIntoEnvironment(projectAppPath: string, projectName: string): Rule {
    const envToAdd = `\n    errorsHandler: {\n        codesToExclude: []\n    }`;
    return chain([
        appendIntoEnvironment(projectAppPath, projectName, envToAdd, 'errorsHandler:', false),
        appendIntoEnvironment(projectAppPath, projectName, envToAdd, 'errorsHandler:', true)
    ]);

    // // const projectEnvPath = join(projectAppPath as Path, prodEnv ? '../environments/environment.prod.ts' : '../environments/environment.ts');
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
    //         const lastRouteNode = node.getLastToken();
    //         const envToAdd = `\n    errorsHandler: {\n        enable: true,\n        codesToExclude: []\n    }`;
    //         if (lastRouteNode) {
    //             changes.push(
    //                 new InsertChange(
    //                     projectEnvPath,
    //                     lastRouteNode.getEnd(),
    //                     `,${envToAdd}`
    //                 )
    //             );
    //         } else {
    //             changes.push(
    //                 new InsertChange(
    //                     projectEnvPath,
    //                     node.getEnd(),
    //                     `${envToAdd}\n`
    //                 )
    //             );
    //         }
    //         console.log(`${colors.green('Changes will be applied to dev environment.')} ${colors.yellow('Please apply it to others.')}`);
    //     } else {
    //         throw new SchematicsException(`No "export const environment" found`);
    //     }
    //     applyChangesToHost(host, projectEnvPath, changes);
    //     return host;
    // };
}

function applyModuleImports(projectAppPath: string, options: ErrorHandlerOptions, useNgxToastr: boolean, isModuleMode: boolean): Rule {
    return host => {
        if (isModuleMode) {
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

            const projectErrorHandlerPath = join(projectAppPath as Path, buildPath, 'modules', 'http-error');
            const relativeErrorHandlerPath = buildRelativePath(modulePath, projectErrorHandlerPath);

            // Add ts imports
            changes.push(insertImport(source, modulePath, 'HttpErrorModule', relativeErrorHandlerPath));
            if (useNgxToastr) {
                changes.push(insertImport(source, modulePath, 'BrowserAnimationsModule', '@angular/platform-browser/animations'));
                changes.push(insertImport(source, modulePath, 'ToastrModule', 'ngx-toastr'));
            }

            // Add environments ts import
            const projectEnvPath = join(projectAppPath as Path, '../environments/environment');
            const relativeEnvPath = buildRelativePath(modulePath, projectEnvPath);
            changes.push(insertImport(source, modulePath, 'environment', relativeEnvPath));

            // Add ng imports
            changes.push(...addImportToModule(source, modulePath, 'HttpErrorModule.forRoot(environment.errorsHandler)', null as any));
            if (useNgxToastr) {
                changes.push(...addImportToModule(source, modulePath, 'BrowserAnimationsModule', null as any));
                changes.push(...addImportToModule(source, modulePath, 'ToastrModule.forRoot()', null as any));
            }

            // Save changes
            applyChangesToHost(host, modulePath, changes);
        } else if (options.appConfig && host.exists(join(projectAppPath as Path, options.appConfig))) {
            const changes: Change[] = [];
            const configPath = join(projectAppPath as Path, options.appConfig);

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

            const projectErrorHandlerPath = join(projectAppPath as Path, buildPath, 'modules', 'http-error', 'http-error.module');
            const relativeErrorHandlerPath = buildRelativePath(configPath, projectErrorHandlerPath);

            // Add ts imports
            changes.push(insertImport(source, configPath, 'provideHttpErrorHandler', relativeErrorHandlerPath));
            if (useNgxToastr) {
                changes.push(insertImport(source, configPath, 'provideToastr', 'ngx-toastr'));
            }

            // Add environments ts import
            const projectEnvPath = join(projectAppPath as Path, '../environments/environment');
            const relativeEnvPath = buildRelativePath(configPath, projectEnvPath);
            changes.push(insertImport(source, configPath, 'environment', relativeEnvPath));

            // Add ng imports
            changes.push(...addProviderToConfig(source, configPath, 'provideHttpErrorHandler(environment.errorsHandler)', null as any));
            if (useNgxToastr) {
                changes.push(...addProviderToConfig(source, configPath, 'provideToastr()', null as any));
            }

            // Save changes
            applyChangesToHost(host, configPath, changes);
        }
        return host;
    };
}

function addNgxToastrStyle(projectAppPath: string, isModule: boolean, options: ErrorHandlerOptions): Rule {
    if (isModule) {
        return host => {
            const changes: Change[] = [];
            const stylePath = join(projectAppPath as Path, '../styles.scss');
            const text = host.read(stylePath);
            if (!text) {
                throw new SchematicsException(`Can not add NgxStoastr style, ${stylePath} does not exist.`);
            }

            if (!text.includes('ngx-toastr/toastr')) {
                changes.push(
                    new InsertChange(
                        stylePath,
                        text.length,
                        `\n@import 'node_modules/ngx-toastr/toastr';\n`
                    )
                );
                applyChangesToHost(host, stylePath, changes);
            }
            return host;
        };
    } else {
        return updateWorkspace((workspace: WorkspaceDefinition) => {
            const project = workspace.projects.get(options.project);
            const buildTarget = project?.targets.get('build');
            if (!buildTarget) {
                throw new SchematicsException('No build target found for the project ' + options.project);
            }
            buildTarget.options ??= {};
            buildTarget.options['styles'] ??= {};
            (buildTarget.options['styles'] as string[]).push('node_modules/ngx-toastr/toastr.css');
        });
    }
}

export default function (options: ErrorHandlerOptions): Rule {
    return async (host: Tree) => {

        const useNgxToastr: boolean = options.useNgxToastr;

        const workspaceConfigBuffer = host.read('angular.json');
        if (!workspaceConfigBuffer) {
            throw new SchematicsException('Not an Angular CLI workspace');
        }

        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectAppPath: string;
        if (project) {
            projectAppPath = buildDefaultPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        const isModuleMode = !!options.appModule && host.exists(join(projectAppPath as Path, options.appModule));

        const parsedPath = join(projectAppPath as Path, buildPath);

        const templateSource = apply(url('./files'), [
            template({
                ...strings,
                ...options,
            }),
            move(parsedPath),
        ]);

        const rules: Rule[] = [
            mergeWith(templateSource),
            applyIntoEnvironment(projectAppPath, options.project),
            // applyIntoEnvironment(projectAppPath, options.project, true),
            applyModuleImports(projectAppPath, options, useNgxToastr, isModuleMode),
        ];

        if (useNgxToastr) {
            rules.push(installNgxToastr());
            rules.push(addNgxToastrStyle(projectAppPath, isModuleMode, options));
        }

        return chain([branchAndMerge(chain(rules))]);
    };
}
