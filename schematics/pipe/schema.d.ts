export interface Schema {
    path?: string;
    project: string;
    name: string;
    skipTests: boolean;
    skipImport: boolean;
    module?: string;
    flat: boolean;
    export: boolean;
    barrel?: boolean;
}
