import { join, Path, strings } from '@angular-devkit/core';
import { apply, branchAndMerge, chain, MergeStrategy, mergeWith, move, Rule, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import { removeSync, existsSync, mkdirSync } from 'fs-extra';
import { join as stringJoin } from 'path';

import { getConfig } from '../../scripts/check-files/util';
import { PluginConnector, GitlabConnector, GithubConnector } from './connectors';

import { Schema as PluginOptions } from './schema';

import { version as ngAfelioVersion } from '../../package.json'
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

        const parsedPath = join(projectAppPath as Path, options.path);

        const pluginsConfig: {
            list: {
                name: string,
                type: 'gitlab' | 'github',
                url: string,
                token: string
            }[]
        } = getConfig('plugins');

        const pluginConfig = pluginsConfig?.list.find(p => p.name === options.pluginName);

        if (!pluginConfig) {
            throw new SchematicsException(`Plugin "${options.pluginName}" not found into your "ng-afelio.json" file.`);
        }

        let connector: PluginConnector;
        if (pluginConfig.type === 'gitlab') {
            connector = new GitlabConnector();
        } else if (pluginConfig.type === 'github') {
            connector = new GithubConnector();
        } else {
            throw new SchematicsException(`Connector "${pluginConfig.type}" not found.`);
        }

        // Get release
        let releases = await connector.getReleases(pluginConfig.url, pluginConfig.token);
        // Filter releases
        releases = releases.filter(r => {
            const askedVersion = r.config.ngAfelioMin.split('.');
            const currentVersion = ngAfelioVersion.split('.');
            return +askedVersion[0] < +currentVersion[0] || (+askedVersion[0] === +currentVersion[0] && +askedVersion[1] <= +currentVersion[1]);
        });

        let release: Release;
        if (releases.length > 0) {
            release = releases[0];
        } else {
            throw new SchematicsException(`No compatible version of this plugin ("${pluginConfig.name}") for this ng-afelio version.`);
        }

        // Download release
        if (existsSync(tempDirectoryPath)) {
            removeSync(tempDirectoryPath);
        }
        mkdirSync(tempDirectoryPath);

        await connector.download(pluginConfig.url, pluginConfig.token, release, tempDirectoryPath);

        const templateSource = apply(url(tempDirectoryPath), [
            template({
              ...strings,
              ...options,
            }),
            move(parsedPath),
        ]);

        return chain([
            branchAndMerge(
                chain([
                    mergeWith(templateSource, MergeStrategy.Overwrite)
                ])
            ),
        ]);

    };
}
