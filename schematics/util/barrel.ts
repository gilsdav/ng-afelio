import { Path, join, strings } from '@angular-devkit/core';
import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import ts = require('typescript');

import { findNodes, insertExport, insertImport } from './ast-util';
import { Change, InsertChange, applyChangesToHost } from './change';


/**
 * @param type something like 'component'
 */
function getListNode(source: ts.SourceFile, type: string): ts.Node | undefined {
    const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);
    for (const keyword of keywords) {
        if (ts.isVariableStatement(keyword)) {
            const [declaration] = keyword.declarationList.declarations;
            if (
                ts.isVariableDeclaration(declaration) &&
                declaration.initializer &&
                declaration.name.getText() === type
            ) {
                return declaration.initializer.getChildAt(1);
            }
        }
    }
}

/**
 * @param type something like 'component'
 */
export function addIntoIndex(path: string, options: { barrel?: boolean, name: string }, type: string, barrelType?: string): Rule {
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
            const filePath = join(path as Path, options.name, `${strings.dasherize(options.name)}.${type}`);
            const relativeFilePath = buildRelativePath(indexPath, `${filePath}.ts`).slice(0, -3);
            const className = `${strings.classify(options.name)}${strings.capitalize(type)}`;
            changes.push(insertImport(source, indexPath, className, relativeFilePath));
            changes.push(insertExport(source, indexPath, className, relativeFilePath));
            // Add Store to Barrel array
            const node = getListNode(source, barrelType || `${type}s`);
            if (node) {
                const commat = node.getChildCount() > 0 ? ',' : '';
                changes.push(
                    new InsertChange(
                        indexPath,
                        node.getEnd(),
                        `${commat}\n    ${className}`
                    )
                );
            }
            // Save changes
            applyChangesToHost(host, indexPath, changes);
        }
        return host;
    };
}

export function relativeCwdFromRelativeProjectPath(relativePath: Path): string {
    const currentCwd = process.cwd();
    if (currentCwd.includes(relativePath)) {
        return '/' + currentCwd.substring(currentCwd.indexOf(relativePath) + 1);
    } else {
        return relativePath;
    }
}
