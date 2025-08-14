## commands

pnpm init

mkdir apps, packages
cd apps , install nest, vite-react, nextjs etc
cd pacakges, mkdir shared-ui, pnpm init and create shared buttons, add tsconfig




# PNPM + Nx Monorepo Handbook

## Table of Contents
1. [Overview](#overview)
2. [Monorepo Structures](#monorepo-structures)
3. [PNPM Workspace Setup](#pnpm-workspace-setup)
4. [PNPM Commands](#pnpm-commands)
5. [Nx Integration](#nx-integration)
6. [Nx Commands](#nx-commands)
7. [Key Benefits](#key-benefits)
8. [Notes](#notes)
9. [References](#references)

## Overview

This handbook covers setting up and managing a monorepo using PNPM workspaces and Nx for enhanced developer experience, caching, and build optimization.

## Monorepo Structures

### App-Centric Structure
```
├── apps/
│   ├── frontend/
│   └── backend/
└── packages/
    ├── shared-ui/
    └── shared-utils/
```

### Package-Centric Structure
```
└── packages/
    ├── app-frontend/
    ├── app-backend/
    ├── shared-ui/
    └── shared-utils/
```

## PNPM Workspace Setup

### Initial Setup
1. Initialize the project:
   ```bash
   pnpm init
   ```

2. Create `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

3. Create directory structure:
   ```
   ├── apps/
   └── packages/
   ```

## PNPM Commands

### Development
```bash
# Run dev server for specific app
pnpm --filter frontend dev

# Run dev server for any app
pnpm --filter appname dev
```

### Building
```bash
# Build all packages recursively
pnpm run -r build

# Build all packages in parallel
pnpm run --parallel -r build
```

### Package Management
```bash
# Add workspace dependency
pnpm add --filter frontend shared-ui --workspace
```

## Nx Integration

PNPM workspaces are excellent for small projects, but as projects grow, Nx provides additional benefits like affected builds, caching, and dependency graph visualization.

### Setup
```bash
# Add Nx to workspace root
pnpm add nx -D -w
```

### Configuration
- Create `nx.json` at the root of your project
- Configure caching, targets, and build settings

## Nx Commands

### Building
```bash
# Build specific package
npx nx build shared-ui

# Build specific app  
npx nx build frontend
```

### Dependency Management
```bash
# View dependency graph
npx nx graph

# View affected projects graph
npx nx graph --affected

# Build only affected projects
npx nx affected:build

npx nx show projects
```

### Bulk Operations
```bash
# Run target on specific project
npx nx run-many --target=build --project=frontend

# Run target on all projects
npx nx run-many --target=build --all
```

## Key Benefits

### PNPM Workspace Benefits
- Efficient disk space usage through hard linking
- Fast installation and hoisting
- Strict dependency resolution

### Nx Benefits
- **Caching**: Builds complete in milliseconds after initial build
- **Affected builds**: Only rebuild what changed
- **Dependency graph**: Visualize project relationships
- **Parallel execution**: Run tasks across multiple projects simultaneously

## Notes

1. **Build Order**: Ensure packages are built before dependent applications
2. **Nx Configuration**: Configure Nx to specify what to cache and when to cache
3. **Performance**: Nx caching can reduce build times dramatically

## References

- [Video Tutorial](https://www.youtube.com/watch?v=ngdoUQBvAjo)




## Adding TailwindCSS v4 in Monorepo

### The Challenge

TailwindCSS works perfectly within the app where it's installed, but fails to apply styles from imported packages. This happens because TailwindCSS doesn't automatically scan package files for class names.

**Example Problem:**
```tsx
// packages/shared-ui/Button.tsx - These classes won't work
<button className="bg-blue-600 text-white hover:bg-blue-700">
  Click me
</button>
```

### The Solution: Nx Sync Generators

Nx provides **sync generators** that automatically:
- Detect imported packages in your apps
- Add `@source` directives to TailwindCSS configuration
- Keep package file paths synchronized
- Enable TailwindCSS to scan package files for class names

### Implementation Steps

#### 1. Install Nx Plugin Support
```bash
npx nx add @nx/plugin
```

#### 2. Create Tailwind Sync Plugin
```bash
npx nx g @nx/plugin:plugin tools/tailwind-sync
```

#### 3. Generate Sync Generator
```bash
npx nx g @nx/plugin:generator --path=tools/tailwind-sync/src/generators/sync-tailwind-sources --name=sync-tailwind-sources
```

#### 4. Configure Frontend App
Add sync generator to `apps/frontend/package.json`:
```json
{
  "nx": {
    "targets": {
      "build": {
        "syncGenerators": ["tailwind-sync:sync-tailwind-sources"]
      },
      "dev": {
        "syncGenerators": ["tailwind-sync:sync-tailwind-sources"]
      }
    }
  }
}
```

#### 5. Run Sync Commands
```bash
# Apply sync generators to update @source directives
npx nx sync

# Preview changes without applying them
npx nx sync:check

# Reset Nx daemon (clears caches)
npx nx reset
```

### Development Tips

**When developing sync generators:**
```bash
# Disable Nx daemon during development
export NX_DAEMON=false
npx nx sync

# Build plugin after changes
npx nx build tailwind-sync

# Re-enable daemon after development
NX_DAEMON=false npx nx build tailwind-sync  
unset NX_DAEMON
```

**Why?** The Nx daemon caches plugin code, so changes won't be reflected until restart. During development:
- ✅ Use `NX_DAEMON=false` to see immediate changes
- ✅ Run `npx nx reset` to clear caches when needed
- ✅ Re-enable daemon after development for performance

### How It Works

The sync generator automatically adds `@source` directives to your app's CSS:

```css
/* Before sync */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After sync */
@tailwind base;
@tailwind components;
@tailwind utilities;

@source "../packages/shared-ui/src/**/*.{ts,tsx}";
@source "../packages/shared-utils/src/**/*.{ts,tsx}";
```

### Usage

**Manual Run:**
```bash
# Run generator manually
npx nx g tailwind-sync:sync-tailwind-sources

```

**Automatic Sync:**
```bash
# Runs automatically during dev/build
npx nx dev frontend
npx nx build frontend
```

**Sample Output:**
```
Syncing TailwindCSS @source directives...
Found workspace packages: [ 'shared-ui' ]
Updated 1 @source directives
```

### Benefits

- **Automatic Detection**: Finds all imported workspace packages
- **Zero Configuration**: Works out of the box with workspace syntax
- **Always in Sync**: Updates when dependencies change
- **Cross-Package Styling**: TailwindCSS classes work everywhere
- **Clean Output**: Simple, professional logging without emojis
