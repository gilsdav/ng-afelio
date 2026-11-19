import { Path, join, strings, workspaces } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import { ProjectType } from '@schematics/angular/utility/workspace-models';

export function buildSelector(options: any, projectPrefix: string) {
  let selector = strings.dasherize(options.name);

  if (options.prefix) {
    selector = `${options.prefix}-${selector}`;
  } else if (options.prefix === undefined && projectPrefix) {
    selector = `${projectPrefix}-${selector}`;
  }

  return selector;
}

/** Chemin source du projet : honore sourceRoot, sinon <root>/src (ex: `/test/bob/src`). */
export function buildProjectSrcPath(project: workspaces.ProjectDefinition): string {
  return project.sourceRoot ? `/${project.sourceRoot}` : `/${project.root}/src`;
}

/** Chemin d'application/bibliothèque du projet : `<src>/app` ou `<src>/lib` selon projectType. */
export function buildDefaultPath(project: workspaces.ProjectDefinition): string {
  const projectDirName = project.extensions['projectType'] === ProjectType.Application ? 'app' : 'lib';
  return join(buildProjectSrcPath(project) as Path, projectDirName);
}

/** Chemin du dossier environments, toujours au niveau du sourceRoot (ex: `/test/bob/src/environments`). */
export function buildEnvironmentsPath(project: workspaces.ProjectDefinition): string {
  return join(buildProjectSrcPath(project) as Path, 'environments');
}

/**
 * Résout un fichier du projet (app.module.ts, app.config.ts…) qui peut être soit directement
 * dans le sourceRoot (layout sans /app), soit dans <src>/app ou <src>/lib.
 * Renvoie le chemin absolu (tree) ou undefined si absent.
 */
export function resolveProjectFile(host: Tree, projectSrcPath: string, projectAppPath: string, file: string): string | undefined {
  const inApp = join(projectAppPath as Path, file);
  if (host.exists(inApp)) {
    return inApp;
  }
  const inSrc = join(projectSrcPath as Path, file);
  if (host.exists(inSrc)) {
    return inSrc;
  }
  return undefined;
}

export async function getLatestVersion(packageName: string): Promise<string> {
  const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
  if (!res.ok) throw new Error(`Package introuvable : ${packageName}`);
  const data = await res.json() as { version: string };
  return data.version;
}
