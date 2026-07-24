import { join, Path, strings } from '@angular-devkit/core';
import { apply, branchAndMerge, chain, filter, MergeStrategy, mergeWith, move, noop, Rule, SchematicContext, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { existsSync, mkdirSync, removeSync } from 'fs-extra';
import * as loading from 'loading-cli';
import { join as stringJoin } from 'path';

import { version as ngAfelioVersion } from '../../package.json';

import { buildDefaultPath } from '../util';
import { parsePackageName } from '../util/name-parser';
import { ConnectorBuilder } from './connector.builder';
import { Release } from './release.model';

import { Schema as PluginOptions } from './schema';


const tempDirectoryPath = stringJoin(__dirname, 'temp-files');


function addDeps(dependencies?: string[], dependenciesType: NodeDependencyType = NodeDependencyType.Default): Rule {
    if (dependencies && dependencies.length > 0) {
        return (host: Tree, context: SchematicContext) => {
            dependencies.forEach(dep => {
                const dependency = parsePackageName(dep);
                if (dependency.name) {
                    const lib: NodeDependency = {
                        type: dependenciesType,
                        name: dependency.name,
                        version: dependency.version,
                        overwrite: false,
                    };
                    addPackageJsonDependency(host, lib);
                }
            });

        };
    } else {
        return noop();
    }
}


export default function (options: PluginOptions): Rule {
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

        const connector = ConnectorBuilder.build(options.pluginRepo);

        const loader = loading({});
        loader.start(`Checking repository "${options.pluginRepo}"`);

        // Get release
        let releases = await connector.getReleases();
        // Filter releases
        releases = connector.filterByNgAfelioVersion(releases, ngAfelioVersion);
        releases = connector.filterByName(releases, options.pluginName);

        let release: Release;
        if (releases.length > 0) {
            release = releases[0];
        } else {
            throw new SchematicsException(`No compatible version of this plugin ("${options.pluginName}") into selected repo ("${options.pluginRepo}") for this ng-afelio version.`);
        }

        const ignoredParts = options.ignoredParts ? options.ignoredParts.split(',') : [];

        // Download release
        if (existsSync(tempDirectoryPath)) {
            removeSync(tempDirectoryPath);
        }
        mkdirSync(tempDirectoryPath);

        loader.text = `Downloading plugin "${options.pluginName}"`;
        await connector.download(release, tempDirectoryPath);

        loader.succeed('Plugin downloaded');

        const templates: Rule[] = release.config.parts.map(part => {
            if (ignoredParts.includes(part.name)) {
                return noop();
            }
            const sourcePath = stringJoin(tempDirectoryPath, part.source);
            const destinationPath = join(projectAppPath as Path, options.path, part.destination);
            const templateSource = apply(url('file://' + sourcePath), [
                filter(p => !p.endsWith('.stories.ts')),
                template({
                    ...strings,
                    ...options,
                }),
                move(destinationPath),
            ]);
            return mergeWith(templateSource, MergeStrategy.Overwrite);
        });


        return chain([
            branchAndMerge(
                chain([
                    ...templates,
                    addDeps(release.config.deps),
                    addDeps(release.config.devDeps, NodeDependencyType.Dev)
                ])
            ),
        ]);

    };
}
