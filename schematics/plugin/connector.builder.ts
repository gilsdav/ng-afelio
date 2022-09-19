import { SchematicsException } from '@angular-devkit/schematics';
import { getConfig } from '../../scripts/check-files/util';
import { GithubConnector, GitlabConnector, PluginConnector } from './connectors';

export class ConnectorBuilder {
    public static build(repoName: string): PluginConnector {
        const pluginRepoConfig = this.getPluginsConfig(repoName);

        let connector: PluginConnector;
        if (pluginRepoConfig.type === 'gitlab') {
            connector = new GitlabConnector(pluginRepoConfig.url, pluginRepoConfig.token);
        } else if (pluginRepoConfig.type === 'github') {
            connector = new GithubConnector(pluginRepoConfig.url, pluginRepoConfig.token);
        } else {
            throw new SchematicsException(`Connector "${pluginRepoConfig.type}" not found.`);
        }

        return connector;
    }

    private static getPluginsConfig(repoName: string) {
        const pluginRepoConfigs: {
            repos: {
                name: string,
                type: 'gitlab' | 'github',
                url: string,
                token: string
            }[]
        } = getConfig('plugins');

        const pluginRepoConfig = pluginRepoConfigs?.repos.find(pr => pr.name === repoName);

        if (!pluginRepoConfig) {
            throw new SchematicsException(`Plugin repo "${repoName}" not found into your "ng-afelio.json" file.`);
        }

        return pluginRepoConfig;
    }
}
