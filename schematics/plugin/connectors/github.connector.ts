import { PluginConnector } from './connector';
import { Release } from '../release.model';

export class GithubConnector extends PluginConnector {
    public getReleases(): Promise<Release[]> {
        throw new Error('Method not implemented.');
    }
    public download(release: Release, tempPath: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
