import { AngularWebpackPlugin, AngularWebpackPluginOptions } from '@ngtools/webpack';
// import { WebpackCompilerHost } from '@ngtools/webpack/src/compiler_host';
import webpack = require('webpack');

import { takeUntilDestroyTransformer } from './ts-transformers/take-until-destroy.transformer';
// import { getSourceFile } from './webpack-compiler-host';

// WebpackCompilerHost.prototype.getSourceFile = getSourceFile;

function findAngularCompilerPlugin(webpackCfg: any): any {
    return webpackCfg?.plugins?.find((plugin: any) => {
        return plugin?.constructor?.name === 'AngularWebpackPlugin';
    });
}

// function isJitMode(acp: AngularWebpackPlugin) {
//     return acp.options.jitMode;
// }

function addTransformerToAngularCompilerPlugin(acp: any, transformer: any): void {
    acp._transformers = [transformer, ...acp._transformers];
}

export default {
    config(webpackConfig: webpack.Configuration) {
        if (webpackConfig.plugins && webpackConfig.plugins.length > 0) {
            const acp = findAngularCompilerPlugin(webpackConfig);
            if (!acp) {
                throw new Error('AngularWebpackPlugin not found');
            }
            const options: AngularWebpackPluginOptions = {
                ...acp.options,
                // directTemplateLoading: false,
            };
            webpackConfig.plugins = webpackConfig.plugins.filter(plugin => plugin !== acp);
            const newCompilerPlugin = new AngularWebpackPlugin(options);
            // if (isJitMode(acp)) {
                addTransformerToAngularCompilerPlugin(newCompilerPlugin, takeUntilDestroyTransformer);
            // }
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
