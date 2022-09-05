import { Release } from '../release.model';
import { PluginConnector } from './connector';

export class GithubConnector extends PluginConnector {
    public getReleases(url: string, token: string): Promise<Release[]> {
        throw new Error('Method not implemented.');
    }
    public download(url: string, token: string, release: Release, tempPath: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
