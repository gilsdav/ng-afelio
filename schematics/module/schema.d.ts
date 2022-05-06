export interface Schema {
    path?: string;
    project: string;
    name: string;
    flat?: boolean;
    guards?: boolean;
    pipes?: boolean;
    stores?: boolean;
    directives?: boolean;
}