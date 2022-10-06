export interface ReleaseConfigPart {
    name: string;
    source: string;
    destination: string;
}

export interface ReleaseConfig {
    ngAfelioMin: string;
    ngAfelioMax: string;
    name: string;
    version: string;
    parts: ReleaseConfigPart[];
    deps?: string[];
    devDeps?: string[];
}

export interface Release {
    versionName: string;
    commitId: string;
    config: ReleaseConfig;
}
