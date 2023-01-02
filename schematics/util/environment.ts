import { join, Path } from '@angular-devkit/core';
import { Rule, SchematicsException } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import * as colors from 'colors';

import { findNodes } from "./ast-util";
import { applyChangesToHost, Change, InsertChange } from './change';

export function getEnvironmentNode(source: ts.SourceFile): ts.Node | undefined {
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

export function appendIntoEnvironment(projectAppPath: string, projectName: string, toAppend: string, toCheck?: string): Rule {

    // const projectEnvPath = join(projectAppPath as Path, prodEnv ? '../environments/environment.prod.ts' : '../environments/environment.ts');
    let projectEnvPath = join(projectAppPath as Path, '../environments/environment.development.ts');

    return host => {
        let text = host.read(projectEnvPath);
        if (!text) { // Fallback for old project version
            projectEnvPath = join(projectAppPath as Path, '../environments/environment.ts');
            text = host.read(projectEnvPath);
        }
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
            if (!toCheck || !node.getText().includes(toCheck)) {
                const lastRouteNode = node.getLastToken();
                if (lastRouteNode) {
                    changes.push(
                        new InsertChange(
                            projectEnvPath,
                            lastRouteNode.getEnd(),
                            `,${toAppend}`
                        )
                    );
                } else {
                    changes.push(
                        new InsertChange(
                            projectEnvPath,
                            node.getEnd(),
                            `${toAppend}\n`
                        )
                    );
                }
                console.log(`${colors.green('Changes will be applied to dev environment.')} ${colors.yellow('Please apply it to others.')}`);
            }
        } else {
            throw new SchematicsException(`No "export const environment" found`);
        }
        applyChangesToHost(host, projectEnvPath, changes);
        return host;
    };
}