import { WorkspaceDefinition } from '@angular-devkit/core/src/workspace';
import { Rule, SchematicsException, Tree, chain, externalSchematic } from '@angular-devkit/schematics';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/workspace';
import { ProjectType, WorkspaceSchema, WorkspaceTargets } from '@schematics/angular/utility/workspace-models';

import { Schema as AddOptions } from './schema';

type WorkspaceTarget = 'build' | 'serve' | 'test';

interface NgxBuildPlusOptions {
  extraWebpackConfig: string;
  plugin: string;
}

const libPath = 'node_modules/ng-afelio';

export default function(options: AddOptions): Rule {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = getProject(options, workspace);

    const ngxBuildPlusOptions = {
      ...options,
      project
    };

    return chain([externalSchematic('ngx-build-plus', 'ng-add', ngxBuildPlusOptions), updateBuilderOptions(options)]);
  };
}

function updateBuilderOptions(options: AddOptions) {
  return async (tree: Tree) => {
    const builderOptions: NgxBuildPlusOptions = {
      extraWebpackConfig: '',
      plugin: `~${libPath}/builders/plugin.js`,
    };

    const workspace = await getWorkspace(tree);
    const project = workspace.projects.get(options.project);

    if (!architect) {
      throw new SchematicsException(`Expected node projects/${project}/architect`);
    }

    addOptions(project, architect, 'build', builderOptions);
    addOptions(project, architect, 'serve', builderOptions);
    addOptions(project, architect, 'test', builderOptions);

    return updateWorkspace(workspace);
  };
}

function addOptions(
  project: string,
  architect: WorkspaceTargets<ProjectType>,
  target: WorkspaceTarget,
  ngxBuildPlusOptions: NgxBuildPlusOptions
) {
  const workspaceTarget = architect[target];

  if (!workspaceTarget) {
    throw new SchematicsException(`Expected node projects/${project}/architect/${target} in angular.json`);
  }

  workspaceTarget.options = {
    ...workspaceTarget.options,
    ...ngxBuildPlusOptions,
  };
}
