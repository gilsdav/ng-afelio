import * as ts from 'typescript';

import { findNode } from '../../schematics/util/ast-util';

function findDecorator(nodes: ts.NodeArray<ts.Decorator>, search: string | RegExp): ts.Node | undefined {
  return nodes.find(node => findNode(node, ts.SyntaxKind.Decorator, search));
}

function removeComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
}

export const takeUntilDestroyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {
    if (/untilDestroyed\(/.test(removeComments(rootNode.getText()))) {
      const visit = (node: ts.Node): ts.Node | ts.Node[] => {
        let decoratorAdded = false;
        if (ts.isClassDeclaration(node) && /untilDestroyed\(this\)/.test(removeComments(node.getText())) && node.decorators) {
          console.log('\nuntilDestroyed detected in ' + rootNode.fileName);
          const angularDecorator = findDecorator(node.decorators, /^(@Component)|(@Directive)|(@Injectable)|(@Pipe)/);
          if (angularDecorator) {
            // @ts-ignore
            node.decorators = ts.factory.createNodeArray(
              [
                ts.factory.createDecorator(ts.factory.createCallExpression(ts.factory.createIdentifier('UntilDestroy'), undefined, [])),
                ...node.decorators,
              ]
            );
            decoratorAdded = true;
          } else {
            console.error('You cannot use "untilDestroyed(this)" oustide of angular element. Error in ' + node.name?.escapedText);
          }
        } else if (ts.isClassDeclaration(node)) {
          console.error('You cannot use "untilDestroyed(this)" oustide of angular element. Error in ' + node.name?.escapedText);
        }
        if (decoratorAdded) {
          const newImport = ts.factory.createImportDeclaration(
            undefined,
            /* modifiers */ undefined,
            ts.factory.createImportClause(
              false,
              undefined,
              ts.factory.createNamedImports([
                ts.factory.createImportSpecifier(false, ts.factory.createIdentifier('UntilDestroy'), ts.factory.createIdentifier('UntilDestroy')),
              ])),
              ts.factory.createStringLiteral('@ngneat/until-destroy'));
          return [ newImport, node ];
        } else {
          return ts.visitEachChild(node, visit, context);
        }
      };
      return ts.visitNode(rootNode, visit);
    }
    return rootNode;
  };
};
