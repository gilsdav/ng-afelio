import { join, Path } from '@angular-devkit/core';
import { Rule, SchematicsException } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { colors } from '../../theme';

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

export function appendIntoEnvironment(environmentsPath: string, projectName: string, toAppend: string, toCheck?: string, prod = false): Rule {

    let devProjectEnvPath = join(environmentsPath as Path, 'environment.development.ts');
    let prodProjectEnvPath = join(environmentsPath as Path, 'environment.ts');
    let projectEnvPath = devProjectEnvPath;

    return host => {
        const legacyEnvironment = host.exists(join(environmentsPath as Path, 'environment.prod.ts'));
        if (legacyEnvironment) {
            projectEnvPath = join(environmentsPath as Path, 'environment.ts');
            prodProjectEnvPath = join(environmentsPath as Path, 'environment.prod.ts');
        }

        if (prod) {
            projectEnvPath = prodProjectEnvPath;
        }

        let text = host.read(projectEnvPath);
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
                            `${lastRouteNode.getFullText().endsWith(',') ? '' : ','}${toAppend}`
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
                console.log(`${colors.green(`Changes will be applied to ${prod ? 'prod' : 'dev'} environment.`)} ${colors.yellow('Please apply it to others.')}`);
            }
        } else {
            throw new SchematicsException(`No "export const environment" found`);
        }
        applyChangesToHost(host, projectEnvPath, changes);
        return host;
    };
}