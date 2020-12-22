import { AngularCompilerPlugin } from '@ngtools/webpack';
import { WebpackCompilerHost } from '@ngtools/webpack/src/compiler_host';
import { AngularCompilerPluginOptions } from '@ngtools/webpack/src/interfaces';
import webpack = require('webpack');

import { takeUntilDestroyTransformer } from './ts-transformers/take-until-destroy.transformer';
import { getSourceFile } from './webpack-compiler-host';

export const JIT_MODE = '_JitMode';

WebpackCompilerHost.prototype.getSourceFile = getSourceFile;

function findAngularCompilerPlugin(webpackCfg: any): any {
    return webpackCfg?.plugins?.find((plugin: any) => {
        return plugin?.constructor?.name === 'AngularCompilerPlugin';
    });
}

function isJitMode(acp: AngularCompilerPlugin) {
    return acp[JIT_MODE];
}

function addTransformerToAngularCompilerPlugin(acp: any, transformer: any): void {
    acp._transformers = [transformer, ...acp._transformers];
}

export default {
    config(webpackConfig: webpack.Configuration) {
        if (webpackConfig.plugins && webpackConfig.plugins.length > 0) {
            const acp = findAngularCompilerPlugin(webpackConfig);
            if (!acp) {
                throw new Error('AngularCompilerPlugin not found');
            }
            const options: AngularCompilerPluginOptions = {
                ...acp.options,
                // directTemplateLoading: false,
            };
            webpackConfig.plugins = webpackConfig.plugins.filter(plugin => plugin !== acp);
            const newCompilerPlugin = new AngularCompilerPlugin(options);
            if (isJitMode(acp)) {
                addTransformerToAngularCompilerPlugin(newCompilerPlugin, takeUntilDestroyTransformer);
            }
            webpackConfig.plugins.push(newCompilerPlugin);
        }
        return webpackConfig;
    },
    // pre(builderConfig: any) {
    //     console.debug('pre', builderConfig);
    // },
    // post() {
    //     console.debug('post');
    // },
};
