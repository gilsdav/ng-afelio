import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree, branchAndMerge, chain, apply, url, template, move, mergeWith } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import ts = require('typescript');

import { addImportToModule, findNodes, insertImport } from '../util/ast-util';
import { Change, applyChangesToHost, InsertChange } from '../util/change';

import { Schema as OIDCOptions } from './schema';

const buildPath = './core/modules/authentication';

function installOAuth(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const lib: NodeDependency = {
            type: NodeDependencyType.Default,
            name: 'angular-oauth2-oidc',
            version: '^10.0.3',
            overwrite: false,
        };
        addPackageJsonDependency(host, lib);
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function applyModuleImports(projectAppPath: string, options: OIDCOptions): Rule {
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
            const projectAuthPath = join(projectAppPath as Path, buildPath);
            const relativeAuthPath = buildRelativePath(modulePath, projectAuthPath);
            // Add ts imports
            changes.push(insertImport(source, modulePath, 'HttpClientModule', '@angular/common/http'));
            changes.push(insertImport(source, modulePath, 'OAuthModule', 'angular-oauth2-oidc'));
            changes.push(insertImport(source, modulePath, 'AuthenticationModule', relativeAuthPath));
            changes.push(insertImport(source, modulePath, 'environment', '../environments/environment'));
            // Add ng imports
            changes.push(...addImportToModule(source, modulePath, 'HttpClientModule', null as any));
            changes.push(...addImportToModule(source, modulePath, 'OAuthModule.forRoot()', null as any));
            changes.push(...addImportToModule(source, modulePath, 'AuthenticationModule.forRoot(environment.oidc)', null as any));
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
                        `,
    oidc: {
        issuer: 'http://keycloak:8080/auth/realms',
        redirectUri: 'http://localhost:4200',
        realm: 'myrealm',
        clientId: 'myapp',
        responseType: 'code',
        scope: 'openid profile email offline_access roles',
        showDebugInformation: true,
        requireHttps: false,
        disableAtHashCheck: true,
        completeSecure: true,
        authErrorRoute: '/auth-error',
        storage: 'session' as const
    }`
                    )


                );
            }
        }
        applyChangesToHost(host, projectEnvPath, changes);
        return host;
    };
}

export default function(options: OIDCOptions): Rule {
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

        const parsedPath = join(projectAppPath as Path, buildPath);

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
                    mergeWith(templateSource),
                    installOAuth(),
                    applyModuleImports(projectAppPath, options),
                    applyIntoEnvironment(projectAppPath, options.project)
                ])
            ),
        ]);
    };
}
