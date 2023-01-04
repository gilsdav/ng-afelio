import { strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';

import { appendIntoEnvironment } from '../util/environment';

import { Schema as DockerOptions } from './schema';

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

function applyIntoEnvironment(projectAppPath: string, projectName: string): Rule {
    // const projectEnvPath = join(projectAppPath as Path, path/*'../environments/environment.ts'*/);
    // return host => {
    //     const text = host.read(projectEnvPath);
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
    //         const lastRouteNode = node.getLastToken();
    //         if (lastRouteNode) {
    //             changes.push(
    //                 new InsertChange(
    //                     projectEnvPath,
    //                     lastRouteNode.getEnd(),
    //                     toAdd
    //                     // `,\n    mock: {\n        enable: true,\n        all: false,\n        services: {\n            getPets: true\n        }\n    }`
    //                 )
    //             );
    //         }
    //     }
    //     applyChangesToHost(host, projectEnvPath, changes);
    //     return host;
    // applyIntoEnvironment(projectAppPath, options.project, `,\n    baseUrls: {\n        main: 'http://localhost:4200/api'\n    }`, false),
    // applyIntoEnvironment(projectAppPath, options.project, `,\n    baseUrls: {\n        main: '\${BASE_URL}'\n    }`, true),


    return chain([
        appendIntoEnvironment(projectAppPath, projectName, `\n    baseUrls: {\n        main: 'http://localhost:4200/api'\n    }`, 'baseUrls:', false),
        appendIntoEnvironment(projectAppPath, projectName, `\n    baseUrls: {\n        main: '\${BASE_URL}'\n    }`, 'baseUrls:', true)
    ]);
}

export default function(options: DockerOptions): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectAppPath: string;
        if (project) {
            projectAppPath = buildDefaultPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        const templateSource = apply(url('./files'), [
            template({
              ...strings,
              ...options,
            }),
            move('/'),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    mergeWith(templateSource),
                    applyIntoEnvironment(projectAppPath, options.project),
                ])
            ),
        ]);
    };
}
