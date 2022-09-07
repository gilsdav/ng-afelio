import fetch, { HeadersInit } from 'node-fetch';
import { copySync, readdirSync, removeSync } from 'fs-extra';
import { join } from 'path';
import { Extract } from 'unzipper';

import { Release } from '../release.model';
import { PluginConnector } from './connector';

export class GitlabConnector extends PluginConnector {

    public getReleases(url: string, token: string): Promise<Release[]> {
        return fetch(`${url}/repository/tags`, {
            headers: this.buildHeader(token)
        })
        .then(res => res.json())
        .then((res: any) => {
            return res.map((r: any) => {
                return {
                    versionName: r.name,
                    commitId: r.target,
                    config: JSON.parse(r.release.description)
                } as Release;
            })
        });

    }
    public async download(url: string, token: string, release: Release, tempPath: string): Promise<void> {
        const res = await fetch(`${url}/repository/archive.zip?sha=${release.commitId}`, {
            headers: this.buildHeader(token)
        });
        const tmpPath = join(tempPath, 'tmp');
        await new Promise((resolve, reject) => {
            if (res && res.body) {
                res.body.pipe(Extract({ path: tmpPath }))
                res.body.on('error', reject);
                res.body.on('end', resolve);
            } else {
                reject('No body on response.');
            }
        });

        const elements = readdirSync(tmpPath, { withFileTypes: true });
        const tempExtractName = elements[0].name;

        copySync(join(tmpPath, tempExtractName, release.config.path), `${tempPath}`);

        removeSync(tmpPath);

    }

    private buildHeader(token?: string): HeadersInit {
        if (token) {
            return {
                'PRIVATE-TOKEN': token
            }
        }
        return {};
    }

}
