import { Release } from '../release.model';

export abstract class PluginConnector {

    constructor(
        public url: string,
        public token: string
    ){}

    public abstract getReleases(): Promise<Release[]>;

    public abstract download(release: Release, tempPath: string): Promise<void>;

    public async getCompatiblePlugins(ngAfelioVersion: string): Promise<string[]> {
        let releases = await this.getReleases();
        releases = this.filterByNgAfelioVersion(releases, ngAfelioVersion);
        let pluginNames = releases.map(r => r.config.name);
        return Array.from(new Set(pluginNames));
    }

    public filterByNgAfelioVersion(releases: Release[], ngAfelioVersion: string): Release[] {
        return releases.filter(r => {
            const askedMinVersion = r.config.ngAfelioMin;
            const askedMaxVersion = r.config.ngAfelioMax;
            const currentVersion = ngAfelioVersion.split('-')[0];

            const minCheck = this.compareVersions(currentVersion, askedMinVersion) >= 0;
            const maxCheck = this.compareVersions(currentVersion, askedMaxVersion) <= 0;

            return minCheck && maxCheck;
        });
    }

    public filterByName(releases: Release[], name: string): Release[] {
        return releases.filter(r => {
            const pluginName = r.config.name;
            return name === pluginName;
        });
    }

    protected compareVersions(versionA: string, versionB: string): number {
        return versionA.localeCompare(versionB, undefined, { numeric: true, sensitivity: 'base' });
    }

}