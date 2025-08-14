import {
  formatFiles,
  Tree,
  readJson,
  logger,
  createProjectGraphAsync,
} from '@nx/devkit';
import * as path from 'path';
import { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { SyncTailwindSourcesGeneratorSchema } from './schema';

export default async function syncTailwindSourcesGenerator(
  tree: Tree,
  schema?: SyncTailwindSourcesGeneratorSchema
): Promise<SyncGeneratorResult | void> {
  // If schema is provided (manual run), use it. Otherwise, process all apps (sync run)
  if (schema?.name) {
    await updateAppSources(tree, schema.name);
    await formatFiles(tree);
    return;
  }

  // Sync mode: process all apps that have workspace dependencies
  const projectGraph = await createProjectGraphAsync();
  let updatedApps = 0;

  logger.info('Running sync generator for all apps...');
  logger.info(`Found ${Object.keys(projectGraph.nodes).length} projects total`);
  
  for (const [projectName, project] of Object.entries(projectGraph.nodes)) {
    logger.info(`Project ${projectName}: type=${project.data.projectType}, root=${project.data.root}`);
    if (project.data.root.startsWith('apps/')) {
      logger.info(`Checking app: ${projectName}`);
      const hasUpdates = await updateAppSources(tree, projectName);
      if (hasUpdates) {
        updatedApps++;
        logger.info(`Updated app: ${projectName}`);
      } else {
        logger.info(`No updates needed for app: ${projectName}`);
      }
    }
  }

  if (updatedApps > 0) {
    await formatFiles(tree);
    return {
      outOfSyncMessage: `Updated @source directives in ${updatedApps} app(s).`,
    };
  }

  return {};
}

async function updateAppSources(tree: Tree, appName: string): Promise<boolean> {
  // Read the app's package.json to find workspace dependencies
  const appPackageJsonPath = `apps/${appName}/package.json`;
  
  if (!tree.exists(appPackageJsonPath)) {
    return false;
  }

  const appPackageJson = readJson(tree, appPackageJsonPath);
  const dependencies = { ...appPackageJson.dependencies, ...appPackageJson.devDependencies };
  
  // Find workspace packages (those with "workspace:*" version)
  const workspacePackages = Object.keys(dependencies).filter(
    (dep) => dependencies[dep] === 'workspace:*'
  );

  if (workspacePackages.length === 0) {
    return false;
  }

  // Generate @source directives for each workspace package
  const sources = workspacePackages
    .map((pkg) => {
      // Check if package exists in packages/ directory
      const packagePath = `packages/${pkg}`;
      if (tree.exists(packagePath)) {
        // Calculate relative path from app to package
        const relativePath = path.relative(`apps/${appName}/src/app`, packagePath);
        return `@source '${relativePath}/';`;
      }
      return null;
    })
    .filter(Boolean);

  if (sources.length === 0) {
    return false;
  }

  // Update globals.css
  const globalsCssPath = `apps/${appName}/src/app/globals.css`;
  
  if (!tree.exists(globalsCssPath)) {
    return false;
  }

  const currentContent = tree.read(globalsCssPath, 'utf-8');
  
  // Remove existing @source lines
  const contentWithoutSources = currentContent
    .split('\n')
    .filter(line => !line.trim().startsWith('@source'))
    .join('\n');

  // Find the position after @import "tailwindcss" or @import 'tailwindcss' to insert sources
  const lines = contentWithoutSources.split('\n');
  const importIndex = lines.findIndex(line => 
    line.includes('@import "tailwindcss"') || line.includes("@import 'tailwindcss'")
  );
  
  if (importIndex === -1) {
    return false;
  }

  // Insert sources after the import and any empty lines
  let insertIndex = importIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex++;
  }

  // Insert the new sources
  lines.splice(insertIndex, 0, '', ...sources);
  const newContent = lines.join('\n');
  
  // Check if content actually changed
  if (currentContent === newContent) {
    return false; // No changes needed
  }

  tree.write(globalsCssPath, newContent);
  
  logger.info(`Updated ${globalsCssPath} with ${sources.length} workspace package sources:`);
  sources.forEach(source => logger.info(`  ${source}`));

  return true;
}
