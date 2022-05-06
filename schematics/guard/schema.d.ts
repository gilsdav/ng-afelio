export interface Schema {
    path?: string;
    project: string;
    name: string;
    skipTests: boolean;
    flat: boolean;
    implements: string;
    barrel?: boolean;
}
