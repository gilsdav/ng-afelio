import { strings, workspaces } from '@angular-devkit/core';

export function buildSelector(options: any, projectPrefix: string) {
  let selector = strings.dasherize(options.name);

  if (options.prefix) {
    selector = `${options.prefix}-${selector}`;
  } else if (options.prefix === undefined && projectPrefix) {
    selector = `${projectPrefix}-${selector}`;
  }

  return selector;
}

export function buildDefaultPath(project: workspaces.ProjectDefinition): string {
  const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
  // const projectDirName = project.extensions['projectType'] === ProjectType.Application ? 'app' : 'lib';
  return `${root}`; // ${projectDirName}
}

export async function getLatestVersion(packageName: string): Promise<string> {
  const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
  if (!res.ok) throw new Error(`Package introuvable : ${packageName}`);
  const data = await res.json() as { version: string };
  return data.version;
}
