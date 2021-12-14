import { strings } from '@angular-devkit/core';
import { apply, chain, externalSchematic, MergeStrategy, mergeWith, move, Rule, SchematicContext, template, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';

import { Schema as FormlyOptions } from './schema';

function installDependencies(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const toInstall: NodeDependency[] = [];
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@ngx-formly/bootstrap',
            version: '5.10.11',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@ngx-formly/core',
            version: '5.10.11',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Default,
            name: '@ngx-formly/schematics',
            version: '5.10.11',
            overwrite: true,
        });
        toInstall.forEach(dep => {
            addPackageJsonDependency(host, dep);
        });
        context.addTask(new NodePackageInstallTask(), []);
    };
}

function installPeerDependencies(projectFormlyPath: string): Rule {
    return (host: Tree, context: SchematicContext) => {
        const toInstall: NodeDependency[] = [];
        toInstall.push({
            type: NodeDependencyType.Peer,
            name: 'moment-es6',
            version: '^1.0.0',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Peer,
            name: 'ngx-bootstrap',
            version: '~5.5.0',
            overwrite: true,
        });
        toInstall.push({
            type: NodeDependencyType.Peer,
            name: '@fullcalendar/angular',
            version: '5.9.0',
            overwrite: true,
        });
        toInstall.forEach(dep => {
            addPackageJsonDependency(host, dep, `${projectFormlyPath}/package.json`);
            dep.type = NodeDependencyType.Default;
            addPackageJsonDependency(host, dep);
        });
        context.addTask(new NodePackageInstallTask(), []);
    };
}

export default function(options: FormlyOptions): Rule {
    return async (host: Tree) => {
        // const workspace = await getWorkspace(host);
        // const project = workspace.projects.get(options.project);
        const projectFormlyPath = '/projects/formly-components';

        // let projectAppPath: string;
        // if (project) {
        //     projectAppPath = buildDefaultPath(project);
        // } else {
        //     throw new SchematicsException(`Project "${options.project}" not found.`);
        // }
        const templateSource = apply(url('./files'), [
            template({
                ...strings,
                ...options,
            }),
            move(`${projectFormlyPath}/src`),
        ]);
        return chain([
            externalSchematic('@schematics/angular', 'library', {
                name: `formly-components`,
                prefix: options.prefix,
            }),
            mergeWith(templateSource, MergeStrategy.Overwrite),
            installDependencies(),
            installPeerDependencies(projectFormlyPath),
        ]);
    };
}
