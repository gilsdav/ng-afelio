import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree, apply, branchAndMerge, chain, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import ts = require('typescript');

import { addImportToModule, findNode, insertImport } from '../util/ast-util';
import { Change, applyChangesToHost } from '../util/change';

import { Schema as TranslateOptions } from './schema';

function installNgxTranslate(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const lib: NodeDependency = {
            type: NodeDependencyType.Default,
            name: '@ngx-translate/core',
            version: '^14.0.0',
            overwrite: false,
        };
        const loader: NodeDependency = {
            type: NodeDependencyType.Default,
            name: '@ngx-translate/http-loader',
            version: '^7.0.0',
            overwrite: false,
        };
        addPackageJsonDependency(host, lib);
        addPackageJsonDependency(host, loader);
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function applyModuleImports(projectAppPath: string, options: TranslateOptions): Rule {
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
            changes.push(insertImport(source, modulePath, 'TranslateLoader, TranslateModule', '@ngx-translate/core'));
            changes.push(insertImport(source, modulePath, 'TranslateHttpLoader', '@ngx-translate/http-loader'));
            changes.push(insertImport(source, modulePath, 'HttpClient, HttpClientModule', '@angular/common/http'));
            // Add ng imports
            const translateImport = `TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            },
        })`;
            changes.push(...addImportToModule(source, modulePath, 'HttpClientModule', null as any));
            changes.push(...addImportToModule(source, modulePath, translateImport, null as any));
            // Save changes
            applyChangesToHost(host, modulePath, changes);
        }
        return host;
    };
}

function addHttpLoader(projectAppPath: string, options: TranslateOptions): Rule {
    return (host: Tree) => {
        if (options.appModule) {
            // const changes: Change[] = [];
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
            const ngModuleDecorator = findNode(source, ts.SyntaxKind.Decorator, '@NgModule');
            if (ngModuleDecorator) {
                const toInsert = `export function createTranslateLoader(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http, './assets/locales/', '.json');
}

`;

                const pos = ngModuleDecorator.getStart();
                const recorder = host.beginUpdate(modulePath);
                recorder.insertRight(pos, toInsert);

                host.commitUpdate(recorder);
            }
        }
        return host;
    };
}

export default function(options: TranslateOptions): Rule {
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

        const parsedPath = join(projectAppPath as Path, '../assets');

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
                    installNgxTranslate(),
                    applyModuleImports(projectAppPath, options),
                    addHttpLoader(projectAppPath, options),
                ])
            ),
        ]);
    };
}
