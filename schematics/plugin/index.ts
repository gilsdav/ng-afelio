import { join, Path, strings } from '@angular-devkit/core';
import { apply, branchAndMerge, chain, MergeStrategy, mergeWith, move, Rule, SchematicsException, template, Tree, url, noop, filter } from '@angular-devkit/schematics';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import { removeSync, existsSync, mkdirSync } from 'fs-extra';
import { join as stringJoin } from 'path';

import { version as ngAfelioVersion } from '../../package.json';

import { Schema as PluginOptions } from './schema';
import { ConnectorBuilder } from './connector.builder';
import { Release } from './release.model';


const tempDirectoryPath = stringJoin(__dirname, 'temp-files');

export default function(options: PluginOptions): Rule {
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

        await connector.download(release, tempDirectoryPath);

        const templates: Rule[] = release.config.parts.map(part => {
            if (ignoredParts.includes(part.name)) {
                return noop();
            }
            const sourcePath = stringJoin(tempDirectoryPath, part.source);
            const destinationPath = join(projectAppPath as Path, options.path, part.destination);
            const templateSource = apply(url(sourcePath), [
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
                    ...templates
                ])
            ),
        ]);

    };
}
