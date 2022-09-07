import { Release } from '../release.model';

export abstract class PluginConnector {

    public abstract getReleases(url: string, token: string): Promise<Release[]>;

    public abstract download(url: string, token: string, release: Release, tempPath: string): Promise<void>;

}