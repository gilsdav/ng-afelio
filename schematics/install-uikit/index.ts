import { Path, join, strings } from '@angular-devkit/core';
import { MergeStrategy, Rule, SchematicContext, SchematicsException, Tree, apply, chain, externalSchematic, mergeWith, move, template, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';

import { Schema as UIKitOptions } from './schema';

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
        toInstall.push({
            type: NodeDependencyType.Default,
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

async function applyUiKitTemplate(options: UIKitOptions): Promise<Rule> {
    const projectUiKitPath = '/projects/ui-kit/src';
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
    return async () => {
        return chain([
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
        ]);
    };
}
