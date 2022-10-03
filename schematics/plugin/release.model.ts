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
}

export interface Release {
    versionName: string;
    commitId: string;
    config: ReleaseConfig;
}
