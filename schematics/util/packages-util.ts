import { Rule, SchematicContext, Tree } from "@angular-devkit/schematics";
import { spawn } from "child_process";

export function installNpmSchematicPackage(packageName: string): Rule {
    return async (host: Tree, context: SchematicContext) => {
        return new Promise<void>((resolve) => {
            context.logger.info(
              `📦 Installing package '${packageName}' for external schematic setup...`,
            );
            spawn('npm', ['install', packageName], { stdio: 'inherit' }).on(
              'close',
              (code: number) => {
                if (code === 0) {
                  context.logger.info(
                    `✅ '${packageName}' package installed successfully`,
                  );
                  resolve();
                } else {
                  const errorMessage = `❌ installation of '${packageName}' package failed`;
                  context.logger.error(errorMessage);
                  throw new Error();
                }
              },
            );
        });
    }
}