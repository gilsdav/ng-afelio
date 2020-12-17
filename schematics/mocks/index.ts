import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';

import { addProviderToModule, findNodes, insertImport } from '../util/ast-util';
import { Change, InsertChange } from '../util/change';

import { Schema as MocksOptions } from './schema';

function applyModuleImports(projectAppPath: string, mockPath: string, options: MocksOptions): Rule {
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
            // Add MockInterceptor ts import
            const relativeMockPath = buildRelativePath(modulePath, mockPath);
            const interceptorPath = join(relativeMockPath as Path, 'mockHttpInterceptor');
            changes.push(insertImport(source, modulePath, 'mockInterceptorProvider', interceptorPath));
            // Add environments ts import
            const projectEnvPath = join(projectAppPath as Path, '../environments/environment');
            const relativeEnvPath = buildRelativePath(modulePath, projectEnvPath);
            changes.push(insertImport(source, modulePath, 'environment', relativeEnvPath));
            // Add provider
            changes.push(...addProviderToModule(source, modulePath, '...(environment.mock.enable ? [mockInterceptorProvider] : [])', null as any));
            // Save changes
            applyChangesToHost(host, modulePath, changes);
        }
        return host;
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

function applyChangesToHost(host: Tree, path: string, changes: Change[]) {
    const recorder = host.beginUpdate(path);
    for (const change of changes) {
        if (change instanceof InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
        }
    }
    host.commitUpdate(recorder);
}

function applyIntoEnvironment(projectAppPath: string, projectName: string): Rule {
    const projectEnvPath = join(projectAppPath as Path, '../environments/environment.ts');
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
                        `,\n    mock: {\n        enable: true,\n        all: false,\n        services: {\n            getPets: true\n        }\n    }`
                    )
                );
            }
        }
        applyChangesToHost(host, projectEnvPath, changes);
        return host;
    };
}

export default function(options: MocksOptions): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectAppPath: string;
        if (project) {
            projectAppPath = buildDefaultPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        const parsedPath = join(projectAppPath as Path, '../mocks');
        const templateSource = apply(url('./files'), [
            template({
                ...strings,
                ...options,
            }),
            move(parsedPath),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    applyIntoEnvironment(projectAppPath, options.project),
                    mergeWith(templateSource),
                    applyModuleImports(projectAppPath, parsedPath, options)
                ])
            ),
        ]);
    };
}
