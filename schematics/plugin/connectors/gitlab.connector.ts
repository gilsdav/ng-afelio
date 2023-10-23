import fetch, { FetchError, HeadersInit } from 'node-fetch';
import { copy, mkdirSync, readdirSync, removeSync } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Extract } from 'unzipper';
import * as colors from 'colors';

import { Release } from '../release.model';
import { PluginConnector } from './connector';

export class GitlabConnector extends PluginConnector {

    public getReleases(): Promise<Release[]> {
        return fetch(`${this.url}/repository/tags`, {
            headers: this.buildHeader(this.token)
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
        })
        .catch(e => {
            if (e instanceof FetchError && e.code === 'ENOTFOUND') {
                console.error(`${ colors.red('Repo not accessible.')} ${colors.cyan('Check your VPN ;)')}`)
            } else {
                throw e;
            }
            return [];
        }) ;

    }
    public async download(release: Release, tempPath: string): Promise<void> {
        removeSync(tempPath);
        mkdirSync(tempPath);
        const res = await fetch(`${this.url}/repository/archive.zip?sha=${release.commitId}`, {
            headers: this.buildHeader(this.token)
        });

        const tmpPath = join(tempPath, 'tmp');
        // await new Promise((resolve, reject) => {
        //     if (res && res.body) {
        //         res.body.pipe(Extract({ path: tmpPath }))
        //         res.body.on('error', reject);
        //         res.body.on('close', resolve);
        //     } else {
        //         reject('No body on response.');
        //     }
        // });

        const buffer = await res.buffer();
        const tempZipFilename = join(tempPath, 'tmp.zip');
        await writeFile(tempZipFilename, buffer);

        await createReadStream(tempZipFilename)
            .pipe(Extract({ path: tmpPath }))
            .promise();
        
        removeSync(tempZipFilename);
        

        // Wait until extract is really ended
        // await new Promise(resolve => { setTimeout(() => resolve(null), 1000) });

        const elements = readdirSync(tmpPath, { withFileTypes: true });
        const tempExtractName = elements[0].name;

        await new Promise((resolve, reject) => {
            copy(join(tmpPath, tempExtractName), `${tempPath}`, { recursive: true }, (error) => {
                if (error) {
                    reject(error);
                }
                resolve(null);
            });
        });

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
