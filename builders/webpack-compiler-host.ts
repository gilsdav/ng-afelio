import { OnErrorFn, WebpackCompilerHost } from '@ngtools/webpack/src/compiler_host';
import * as ts from 'typescript';

import { takeUntilDestroyTransformer } from './ts-transformers/take-until-destroy.transformer';

// https://github.com/typebytes/ngx-template-streams/blob/master/projects/ngx-template-streams/src/internal/webpack-compiler-host.ts

// This key is used to access a private property on the compiler host
// that indicates whether we are running in AOT or not
export const RESOURCE_LOADER = '_resourceLoader';

export function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: OnErrorFn): ts.SourceFile | undefined {
  // @ts-ignore
  const p = this.resolve(fileName);

  try {
    // @ts-ignore
    const cached = this._sourceFileCache.get(p);
    if (cached) {
      return cached;
    }

    // @ts-ignore
    const isAOT = getResourceLoader(this);
    // @ts-ignore
    const content = this.readFile(fileName);

    if (content !== undefined) {
      let sf = ts.createSourceFile(fileName, content, languageVersion, true);

      if (isAOT) {
        const sfTransformed = ts.transform(sf, [takeUntilDestroyTransformer]).transformed[0];
        const newFileContent = printFileContent(sfTransformed);
        sf = ts.createSourceFile(fileName, newFileContent, languageVersion);
      }

      // @ts-ignore
      if (this.cacheSourceFiles) {
        // @ts-ignore
        this._sourceFileCache.set(p, sf);
      }

      return sf;
    }
  } catch (e) {
    if (onError) {
      onError(e.message);
    }
  }

  return undefined;
}

function getResourceLoader(host: WebpackCompilerHost) {
  return host[RESOURCE_LOADER];
}

export function printFileContent(sourceFile: ts.SourceFile, newLine = ts.NewLineKind.LineFeed): string {
  const printer = ts.createPrinter({
    newLine,
  });

  return printer.printFile(sourceFile);
}
