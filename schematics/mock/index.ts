import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateName } from '@schematics/angular/utility/validation';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import ts = require('typescript');
import * as colors from 'colors';

import { findNode, findNodes, insertImport } from '../util/ast-util';
import { Change, InsertChange, applyChangesToHost } from '../util/change';

import { Schema as MockOptions } from './schema';

function getMocksNode(source: ts.SourceFile): ts.Node | undefined {
    const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);
    for (const keyword of keywords) {
        if (ts.isVariableStatement(keyword)) {
            const [declaration] = keyword.declarationList.declarations;
            if (
                ts.isVariableDeclaration(declaration) &&
                declaration.initializer &&
                declaration.name.getText() === 'mocks'
            ) {
                return declaration.initializer.getChildAt(1);
            }
        }
    }
}

function includesIntoProject(path: string, options: MockOptions): Rule {
    return host => {
        if (options.includes) {
            const changes: Change[] = [];
            const mockListPath = join(path as Path, 'mocks.ts');
            const text = host.read(mockListPath);
            if (!text) {
                throw new SchematicsException(`Can not add to mock list, ${mockListPath} does not exist.`);
            }
            const sourceText = text.toString('utf8');
            const source = ts.createSourceFile(
                mockListPath,
                sourceText,
                ts.ScriptTarget.Latest,
                true
            );
             // Add Store to ts import
            const mockPath = join(path as Path, options.file.replace('.ts', ''));
            const relativeMockPath = buildRelativePath(mockListPath, `${mockPath}.ts`).slice(0, -3);
            const nameExtraction = options.file.match(/(\w*).mock.ts/);
            if (nameExtraction) {
                const mocksToAdd = `${nameExtraction[1]}Mocks`;
                changes.push(insertImport(source, mockListPath, `listeners as ${mocksToAdd}`, relativeMockPath));
                // Add Store to Barrel array
                const node = getMocksNode(source);
                if (node) {
                    const commat = node.getChildCount() > 0 ? ',' : '';
                    changes.push(
                        new InsertChange(
                            mockListPath,
                            node.getEnd(),
                            `${commat}\n    ...${mocksToAdd}`
                        )
                    );
                }
            } else {
                throw new SchematicsException(`Can not extract name from file name ${options.file}`);
            }
            
            // Save changes
            applyChangesToHost(host, mockListPath, changes);
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

function getEnvServiceMocksNode(source: ts.Node): ts.Node | undefined {
    let mockServices: ts.Node | undefined;
    const services = findNode(source, ts.SyntaxKind.PropertyAssignment, /^services:/, true);
    if (services && ts.isPropertyAssignment(services)) {
        mockServices = services.initializer.getChildAt(1);
    }
    return mockServices;
}

function addProperty(projectEnvPath: string, node: ts.Node, mockName: string) {
    const commat = node.getChildCount() > 0 ? ',' : '';
    const position = node.getChildCount() > 0 ? node.getChildren()[node.getChildCount() - 1].getEnd() : node.getStart();
    return new InsertChange(
        projectEnvPath,
        position,
        `${commat}\n            ${mockName}: true`
    );
}

function addIntoEnvironment(projectAppPath: string, projectName: string, options: MockOptions): Rule {
    const projectEnvPath = join(projectAppPath as Path, '../environments/environment.ts');
    return host => {
        if (options.environment) {
            const text = host.read(projectEnvPath);
            if (!text) {
                throw new SchematicsException(`Environment file in ${projectName} project does not exist.`);
            }
            const sourceText = text.toString('utf8');
            const source = ts.createSourceFile(
                projectEnvPath,
                sourceText,
                ts.ScriptTarget.Latest,
                true
            );
            const envNode = getEnvironmentNode(source);
            const changes: Change[] = [];
            if (envNode) {
                const serviceMockList = getEnvServiceMocksNode(envNode);
                if (serviceMockList) {
                    changes.push(addProperty(projectEnvPath, serviceMockList, strings.camelize(options.name)));
                } else {
                    throw new SchematicsException(`Can not find mock.services in ${projectName} project. Did you already add the mock system "${colors.cyan('ng-afelio install mocks')}" ?`);
                }
            }
            applyChangesToHost(host, projectEnvPath, changes);
        }
        return host;
    };
}

function getListenersNode(source: ts.SourceFile): ts.Node | undefined {
    let listeners: ts.Node | undefined;
    const listenNode = findNode(source, ts.SyntaxKind.VariableDeclaration, /^listeners/, false);
    if (listenNode && ts.isVariableDeclaration(listenNode)) {
        listeners = listenNode.initializer?.getChildAt(1);
    }
    return listeners;
}

function addListener(mockPath: string, node: ts.Node, mockName: string) {
    const commat = node.getChildCount() > 0 ? ',' : '';
    const position = node.getChildCount() > 0 ? node.getChildren()[node.getChildCount() - 1].getEnd() : node.getStart();
    return new InsertChange(
        mockPath,
        position,
        `${commat}\n    { url: '/store/inventory', methods: 'GET', name: '${mockName}', response: ${mockName}Mock }`
    );
}

function addMockFunction(mockPath: string, node: ts.Node, mockName: string) {
    const position = node.getStart() - 1;
    const toInsert = `
const ${mockName}Mock = (request: HttpRequest<any>) => new HttpResponse({
    status: 200,
    body: {
        url: 'https://www.wikipedia.org'
    }
});
`;
    return new InsertChange(
        mockPath,
        position,
        toInsert
    );
}

function addMockIntoExistingFile(mockPath: string, options: MockOptions): Rule {
    return host => {
        const text = host.read(mockPath);
        if (!text) {
            throw new SchematicsException(`Can not find mock file ${mockPath} in the current path.`);
        }
        const sourceText = text.toString('utf8');
        const source = ts.createSourceFile(
            mockPath,
            sourceText,
            ts.ScriptTarget.Latest,
            true
        );

        const listeners = getListenersNode(source);
        if (listeners) {
            const changes: Change[] = [];
            const camelizedName = strings.camelize(options.name);
            changes.push(addMockFunction(mockPath, listeners.parent.parent.parent.parent, camelizedName)); // final parent = VariableStatement
            changes.push(addListener(mockPath, listeners, camelizedName));
            applyChangesToHost(host, mockPath, changes);
        }
    };
}

export default function(options: MockOptions): Rule {
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

        if (project && options.path === undefined) {
            options.path = projectAppPath;
        }

        const parsedPath = parseName(options.path as string, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;

        validateName(options.name);

        const templateSource = apply(url('./files'), [
            template({
              ...strings,
              ...options,
            }),
            move(parsedPath.path),
        ]);

        let steps = [];
        const mockPath = join(options.path as Path, options.file);
        const fileExists = !!host.read(mockPath);
        if (fileExists) {
            steps = [
                addMockIntoExistingFile(mockPath, options)
            ];
        } else {
            steps = [
                mergeWith(templateSource),
                includesIntoProject(options.path, options)
            ];
        }

        return chain([
            branchAndMerge(
                chain([
                    ...steps,
                    addIntoEnvironment(projectAppPath, options.project, options)
                ])
            ),
        ]);
    };
}
