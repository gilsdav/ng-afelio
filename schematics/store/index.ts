import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, noop, template, url } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import ts = require('typescript');

import { findNodes, insertImport } from '../util/ast-util';
import { Change, InsertChange, applyChangesToHost } from '../util/change';
import { validateName } from '../util/validation';

import { Schema as StoreOptions } from './schema';

function getStoreNode(source: ts.SourceFile): ts.Node | undefined {
    const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);
    for (const keyword of keywords) {
        if (ts.isVariableStatement(keyword)) {
            const [declaration] = keyword.declarationList.declarations;
            if (
                ts.isVariableDeclaration(declaration) &&
                declaration.initializer &&
                declaration.name.getText() === 'stores'
            ) {
                return declaration.initializer.getChildAt(1);
            }
        }
    }
}

function addIntoIndex(path: string, options: StoreOptions): Rule {
    return host => {
        if (options.barrel) {
            const changes: Change[] = [];
            const indexPath = join(path as Path, 'index.ts');
            const text = host.read(indexPath);
            if (!text) {
                throw new SchematicsException(`Can not add to barrel, ${indexPath} does not exist.`);
            }
            const sourceText = text.toString('utf8');
            const source = ts.createSourceFile(
                indexPath,
                sourceText,
                ts.ScriptTarget.Latest,
                true
            );
             // Add Store to ts import
            const storePath = join(path as Path, options.name, `${strings.dasherize(options.name)}.store`);
            const relativeStorePath = buildRelativePath(indexPath, `${storePath}.ts`).slice(0, -3);
            const stateName = `${strings.classify(options.name)}State`;
            changes.push(insertImport(source, indexPath, stateName, relativeStorePath));
            // Add Store to Barrel array
            const node = getStoreNode(source);
            if (node) {
                const commat = node.getChildCount() > 0 ? ',' : '';
                changes.push(
                    new InsertChange(
                        indexPath,
                        node.getEnd(),
                        `${commat}\n    ${stateName}`
                    )
                );
            }
            // Save changes
            applyChangesToHost(host, indexPath, changes);
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
        if (project && options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        const parsedPath = parseName(options.path as string, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;

        validateName(options.name);

        const templateSource = apply(url('./files'), [
            options.spec ? noop() : filter(p => !p.endsWith('.spec.ts')),
            template({
              ...strings,
              ...options,
            }),
            move(parsedPath.path),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    mergeWith(templateSource),
                    addIntoIndex(options.path, options),
                ])
            ),
        ]);
    };
}
