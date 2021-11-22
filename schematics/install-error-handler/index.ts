import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree, apply, branchAndMerge, chain, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';

import { addImportToModule, findNodes, insertImport } from '../util/ast-util';
import { Change, InsertChange, applyChangesToHost } from '../util/change';

import { Schema as ErrorHandlerOptions } from './schema';

const buildPath = './core';

function installNgxToastr(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const ngxToastr: NodeDependency = {
            type: NodeDependencyType.Default,
            name: 'ngx-toastr',
            version: '14.0.0',
            overwrite: false,
        };
        addPackageJsonDependency(host, ngxToastr);
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function getEnvironmentNode(source: ts.SourceFile): ts.Node | undefined {
    const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);
    for (const keyword of keywords) {
        if (ts.isVariableStatement(keyword)) {
            const [declaration] = keyword.declarationList.declarations;
            if (
                ts.isVariableDeclaration(declaration) &&
                declaration.initializer &&
                declaration.name.getText() === 'environment'
            ) {
                return declaration.initializer.getChildAt(1);
            }
        }
    }
}

function applyIntoEnvironment(projectAppPath: string, projectName: string, prodEnv = false): Rule {

    const projectEnvPath = join(projectAppPath as Path, prodEnv ? '../environments/environment.prod.ts' : '../environments/environment.ts');

    return host => {
        const text = host.read(projectEnvPath);
        if (!text) {
            throw new SchematicsException(`Environment file on ${projectName} project does not exist.`);
        }
        const sourceText = text.toString('utf8');
        const source = ts.createSourceFile(
            projectEnvPath,
            sourceText,
            ts.ScriptTarget.Latest,
            true
        );
        const node = getEnvironmentNode(source);
        const changes: Change[] = [];
        if (node) {
            const lastRouteNode = node.getLastToken();
            if (lastRouteNode) {
                changes.push(
                    new InsertChange(
                        projectEnvPath,
                        lastRouteNode.getEnd(),
                        `,\n    errorsHandler: {\n        enable: true,\n        codesToExclude: []\n    }`
                    )
                );
            }
        }
        applyChangesToHost(host, projectEnvPath, changes);
        return host;
    };
}

function applyModuleImports(projectAppPath: string, options: ErrorHandlerOptions, useNgxToastr: boolean): Rule {
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
        }
        return host;
    };
}

function addNgxToastrStyle(projectAppPath: string): Rule {
    return host => {
        const changes: Change[] = [];
        const stylePath = join(projectAppPath as Path, '../styles.scss');
        const text = host.read(stylePath);
        if (!text) {
            throw new SchematicsException(`Can not add NgxStoastr style, ${stylePath} does not exist.`);
        }

        changes.push(
            new InsertChange(
                stylePath,
                text.length,
                `\n@import '~ngx-toastr/toastr';\n`
            )
        );
        applyChangesToHost(host, stylePath, changes);
        return host;
    };
}

export default function(options: ErrorHandlerOptions): Rule {
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
            applyIntoEnvironment(projectAppPath, options.project, true),
            applyModuleImports(projectAppPath, options, useNgxToastr),
        ];

        if (useNgxToastr) {
            rules.push(installNgxToastr());
            rules.push(addNgxToastrStyle(projectAppPath));
        }

        return chain([branchAndMerge(chain(rules))]);
    };
}
