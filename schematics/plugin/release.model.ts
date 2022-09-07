export interface ReleaseConfig {
    ngAfelioMin: string,
    name: string,
    path: string
}

export interface Release {
    versionName: string,
    commitId: string,
    config: ReleaseConfig
}
