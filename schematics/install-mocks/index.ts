import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';

import { addProviderToConfig, addProviderToModule, insertImport } from '../util/ast-util';
import { Change, applyChangesToHost } from '../util/change';
import { Schema as MocksOptions } from './schema';
import { appendIntoEnvironment } from '../util/environment';
import { getPackageJsonDependency } from '@schematics/angular/utility/dependencies';

function applyModuleImports(projectAppPath: string, mockPath: string, options: MocksOptions, isModuleMode: boolean): Rule {
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
        } else if (options.appConfig && host.exists(join(projectAppPath as Path, options.appConfig))) {
            const changes: Change[] = [];
            const configPagh = join(projectAppPath as Path, options.appConfig);
            const text = host.read(configPagh);
            if (!text) {
                throw new SchematicsException(`Config file at ${configPagh} does not exist.`);
            }
            const sourceText = text.toString('utf8');
            const source = ts.createSourceFile(
                configPagh,
                sourceText,
                ts.ScriptTarget.Latest,
                true
            );
            // Add ts imports
            if (options.auth) {
                changes.push(insertImport(source, configPagh, 'mockAuthenticationProviders', '../mocks/authentication.mock'));
            }
            changes.push(insertImport(source, configPagh, 'mockInterceptorProvider', '../mocks/mockHttpInterceptor'));
            changes.push(insertImport(source, configPagh, 'environment', '../environments/environment'));
            // Add ng imports
            let mockProviders = `...(environment.mock.enable ? [mockInterceptorProvider] : [])`;
            if (options.auth) {
                mockProviders = `...(environment.mock.enable ? [mockInterceptorProvider, ...((environment.mock.auth || environment.mock.all) ? mockAuthenticationProviders : [])] : [])`;
            }
            changes.push(...addProviderToConfig(source, configPagh, mockProviders, null as any));
            // Save changes
            applyChangesToHost(host, configPagh, changes);
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

function applyIntoEnvironment(projectAppPath: string, projectName: string, addAuth: boolean): Rule {
    const envToAdd = `\n    mock: {\n        enable: true,${addAuth ? '\n        auth: true,' : ''}\n        all: false,\n        services: {\n            getPets: true\n        }\n    }`;
    const envToAddProd = `\n    mock: {\n        enable: false,${addAuth ? '\n        auth: false,' : ''}\n        all: false,\n        services: {\n            getPets: false\n        }\n    }`;
    return chain([
        appendIntoEnvironment(projectAppPath, projectName, envToAdd, 'mock:', false),
        appendIntoEnvironment(projectAppPath, projectName, envToAddProd, 'mock:', true)
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
    //         if (!node.getText().includes('mock:')) {
    //             const lastRouteNode = node.getLastToken();
    //             const mocksToAdd = `\n    mock: {\n        enable: true,\n        all: false,\n        services: {\n            getPets: true\n        }\n    }`;
    //             if (lastRouteNode) {
    //                 changes.push(
    //                     new InsertChange(
    //                         projectEnvPath,
    //                         lastRouteNode.getEnd(),
    //                         `,${mocksToAdd}`
    //                     )
    //                 );
    //             } else {
    //                 changes.push(
    //                     new InsertChange(
    //                         projectEnvPath,
    //                         node.getEnd(),
    //                         `${mocksToAdd}\n`
    //                     )
    //                 );
    //             }
    //             console.log(`${colors.green('Changes will be applied to dev environment.')} ${colors.yellow('Please apply it to others.')}`)
    //         }
    //     } else {
    //         throw new SchematicsException(`No "export const environment" found`);
    //     }
    //     applyChangesToHost(host, projectEnvPath, changes);
    //     return host;
    // };
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

        const isModuleMode = !!options.appModule && host.exists(join(projectAppPath as Path, options.appModule));

        if (options.auth) {
            const dependency = getPackageJsonDependency(host, 'angular-auth-oidc-client');
            if (!dependency) {
                throw new SchematicsException(`angular-auth-oidc-client library not found. Please start with "oidc" install before generate auth mock or add "--auth=false".`);
            }   
        }

        const parsedPath = join(projectAppPath as Path, '../mocks');
        const templateSource = apply(url('./files'), [
            filter(path => !path.endsWith('authentication.mock.ts') || options.auth),
            template({
                ...strings,
                ...options,
            }),
            move(parsedPath),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    applyIntoEnvironment(projectAppPath, options.project, (options.auth && !isModuleMode)),
                    mergeWith(templateSource),
                    applyModuleImports(projectAppPath, parsedPath, options, isModuleMode),
                ])
            ),
        ]);
    };
}
