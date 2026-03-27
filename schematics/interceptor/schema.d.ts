export interface Schema {
    path?: string;
    project: string;
    name: string;
    skipTests: boolean;
    flat: boolean;
    implements: string;
    functional: boolean;
    barrel?: boolean;
    typeSeparator: boolean;
}
