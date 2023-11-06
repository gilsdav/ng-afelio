import { Path, join, strings } from '@angular-devkit/core';
import { MergeStrategy, Rule, SchematicContext, SchematicsException, Tree, apply, chain, externalSchematic, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import { installNpmSchematicPackage } from '../util/packages-util';

import { Schema as UIKitOptionsExternal } from './schema';

type UIKitOptions = UIKitOptionsExternal & { projectPath: Path };

function installDependencies(options: UIKitOptions): Rule {
    const needBootstrap = !!options && options.type === 'bootstrap';
    return (host: Tree, context: SchematicContext) => {
        const toInstall: NodeDependency[] = [];
        if (needBootstrap) {
            toInstall.push({
                type: NodeDependencyType.Default,
                name: 'bootstrap',
                version: '4.1.3',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Default,
                name: 'font-awesome',
                version: '4.7.0',
                overwrite: true,
            });
        }
        if (needBootstrap || options.type === 'afelio') {
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'ngx-highlight-js',
                version: '10.0.3',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Default,
                name: '@ng-select/ng-select',
                version: '7.3.0',
                overwrite: true,
            });
        }
        if (options.type === 'tailwind') {
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'tailwindcss',
                version: '^3.3.2',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'postcss',
                version: '^8.4.24',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'autoprefixer',
                version: '^10.4.13',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'postcss-import',
                version: '^15.1.0',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'postcss-nested-ancestors',
                version: '^3.0.0',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'prettier-plugin-tailwindcss',
                version: '^0.3.0',
                overwrite: true,
            });
            toInstall.push({
                type: NodeDependencyType.Dev,
                name: 'prettier',
                version: '^2.8.8',
                overwrite: true,
            });
        }
        toInstall.forEach(dep => {
            addPackageJsonDependency(host, dep);
        });
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function updateScripts(): Rule {
    return (host: Tree) => {
        const packageFile = '/package.json';
        const text = host.read(packageFile);
        if (!text) {
            throw new SchematicsException(`Can not find "package.json" file in your project.`);
        }
        const sourceText = text.toString('utf8');
        const toInsert = `"style": "ng-afelio style"`;
        const alreadyInstalled = sourceText.indexOf(toInsert) !== -1;
        if (!alreadyInstalled) {
            const toReplaceMatch = sourceText.match(/"start": "(.+)"/);
            if (toReplaceMatch) {
                const jsonContent = JSON.parse(sourceText);
                jsonContent.scripts['start'] = 'ng-afelio start';
                jsonContent.scripts['style'] = 'ng-afelio style';
                jsonContent.scripts['style-watch'] = 'ng-afelio style --watch projects/ui-kit';
                host.overwrite(packageFile, JSON.stringify(jsonContent, null, 2));
            }
        }
        return host;
    };
}

function addLinesToMainStyleFile(options: UIKitOptions): Rule {
    return (host: Tree) => {
        const styleFilePath = join(options.projectPath, 'styles.scss');
        const text = host.read(styleFilePath);
        if (!text) {
            throw new SchematicsException(`Can not find "styles.scss" file in your project.`);
        }
        const sourceText = text.toString('utf8');

        const relativeMainStylePath = buildRelativePath(styleFilePath, '/styles/main.scss');

        const toInsert = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '${relativeMainStylePath}';
`;
        const alreadyInstalled = sourceText.indexOf('@tailwind base') !== -1;
        if (!alreadyInstalled) {
            const newStyleContent = `${sourceText}${toInsert}`;
            host.overwrite(styleFilePath, newStyleContent);
        }

        return host;
    };
}

async function applyUiKitTemplate(options: UIKitOptions, projectUiKitPath = '/projects/ui-kit/src'): Promise<Rule> {
    const templateSource = apply(url(join('./files' as Path, options.type)), [
        template({
          ...strings,
          ...options,
        }),
        move(projectUiKitPath),
    ]);
    return mergeWith(templateSource, MergeStrategy.Overwrite);
}

export default function(options: UIKitOptions): Rule {
    return async (host: Tree) => {

        const workspaceConfigBuffer = host.read('angular.json');
        if (!workspaceConfigBuffer) {
            throw new SchematicsException('Not an Angular CLI workspace');
        }

        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project);

        let projectAppPath: string;
        if (project) {
            projectAppPath = buildDefaultPath(project);
        } else {
            throw new SchematicsException(`Project "${options.project}" not found.`);
        }

        options.projectPath = join(projectAppPath as Path, '..');

        let rules: Rule[] = [];

        if (options.type === 'bootstrap' || options.type === 'afelio') {
            rules = [
                externalSchematic('@schematics/angular', 'application', {
                    name: 'ui-kit',
                    routing: true,
                    style: 'scss',
                    skipTests: true,
                    skipInstall: true,
                    minimal: true,
                }),
                await applyUiKitTemplate(options),
                updateScripts(),
                installDependencies(options),
            ]
        } else if (options.type === 'tailwind') {
            rules = [
                await applyUiKitTemplate(options, '/'),
                installNpmSchematicPackage('@angular/material'),
                installDependencies(options),
                externalSchematic('@angular/material', 'ng-add', {}),
                addLinesToMainStyleFile(options)
            ]
        }
        return chain(rules);
    };
}
