export interface Schema {
    path?: string;
    project: string;
    name: string;
    displayBlock: boolean;
    inlineStyle: boolean;
    inlineTemplate: boolean;
    viewEncapsulation?: 'Emulated' | 'None' | 'ShadowDom';
    changeDetection: 'Default' | 'OnPush';
    prefix?: string;
    style: 'css' | 'scss' | 'sass' | 'less' | 'none';
    type: string;
    skipTests: boolean;
    flat: boolean;
    skipImport: boolean;
    selector?: string;
    skipSelector: boolean;
    module?: string;
    barrel?: boolean;
}