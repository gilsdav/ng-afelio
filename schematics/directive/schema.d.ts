export interface Schema {
    path?: string;
    project: string;
    name: string;
    prefix?: string;
    skipTests: boolean;
    skipImport: boolean;
    selector?: string;
    flat: boolean;
    module?: string;
    export: boolean;
    barrel?: boolean;
}
