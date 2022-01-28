import { Path, strings } from '@angular-devkit/core';
import { apply, chain, externalSchematic, MergeStrategy, mergeWith, move, Rule, schematic, SchematicContext, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { Schema as DesignSystemOptions } from './schema';

function installDependencies(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const toInstall: NodeDependency[] = [];
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/addon-actions',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/addon-essentials',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/addon-links',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/angular',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/builder-webpack5',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/manager-webpack5',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/addons',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/addon-controls',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/theming',
            version: '6.4.14',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@storybook/addon-notes',
            version: '5.3.21',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@compodoc/compodoc',
            version: '1.1.11',
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
        const toInsert = `
        "build-ds": "ng-afelio build design-system"
        `;
        const alreadyInstalled = sourceText.indexOf(toInsert) !== -1;
        if (!alreadyInstalled) {
            const toReplaceMatch = sourceText.match(/"start": "(.+)"/);
            if (toReplaceMatch) {
                const jsonContent = JSON.parse(sourceText);
                jsonContent.scripts['build-ds'] = 'ng-afelio build design-system';

                jsonContent.scripts['docs:json'] = 'compodoc -p ./tsconfig.json -e json -d .';
                jsonContent.scripts['docs'] = 'compodoc -p ./tsconfig.json . -s';

                jsonContent.scripts['storybook'] = 'npm run docs:json && start-storybook -p 6007 -s ./public';
                jsonContent.scripts['build-storybook'] = 'npm run docs:json && build-storybook';

                host.overwrite(packageFile, JSON.stringify(jsonContent, null, 2));
            }
        }
        return host;
    };
}

async function applyDesignSytemTemplate(options: DesignSystemOptions): Promise<Rule> {
    const projectDesignSytemPath = `/projects/${options.name ? options.name : 'design-sytem'}/src`;
    const templateSource = apply(url('./files' as Path), [
        template({
          ...strings,
          ...options,
        }),
        move(projectDesignSytemPath),
    ]);
    return mergeWith(templateSource, MergeStrategy.Overwrite);
}

async function applyDesignSystemDocumentationTemplate(options: DesignSystemOptions): Promise<Rule> {
    const projectDesignSytemPath = `./`;
    const templateSource = apply(url('./storybook-files' as Path), [
        template({
          ...strings,
          ...options,
        }),
        move(projectDesignSytemPath),
    ]);
    return mergeWith(templateSource, MergeStrategy.Overwrite);
}

export default function(options: DesignSystemOptions): Rule {
    return async () => {
        return chain([
            externalSchematic('@schematics/angular', 'library', {
                name: options.name ? options.name : 'design-system',
                prefix: options.prefix ? options.prefix : 'ds',
                skipInstall: true,
            }),
            schematic('install-translate', {}),
            await applyDesignSytemTemplate(options),
            await applyDesignSystemDocumentationTemplate(options),
            updateScripts(),
            installDependencies(),
        ]);
    };
}
