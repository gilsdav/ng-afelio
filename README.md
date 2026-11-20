# ng-keyes

**Angular Development Accelerator** — an extended Angular CLI that speeds up Angular development with opinionated generators, UI Kit management, API code generation, and AI devcontainer support.

Also published under the aliases **ng-nrb** and **ng-afelio** (all three bins point to the same CLI).

> ⚠️ **Deprecation notice**
>
> The **UI Kit** parts of this CLI are **deprecated** and will be removed in a future major release. The following are affected and should no longer be used in new projects:
>
> - the `--ui-kit` option of `new`
> - the `uiServe` (`us`) command and the UI Kit options of `start` (`--ui-port`, `--ui-ng`)
> - the `install uikit` command
> - the `style` command
>
> Handle styling directly with your framework of choice (Tailwind, Bootstrap, ...).

[![rc npm version](https://img.shields.io/npm/v/ng-afelio/rc)](https://www.npmjs.com/package/ng-afelio/v/rc)
[![stable npm version](https://img.shields.io/npm/v/ng-afelio)](https://www.npmjs.com/package/ng-afelio)

## Features

- **Project scaffolding** — create a new Angular project pre-wired with ng-keyes and an optional OpenAPI setup
- **Opinionated generators** — components, modules, NGXS stores, mocks, guards, pipes, interceptors, ...
- **Installers** — drop in ready-made systems: mocks, i18n/translate, NGXS store, Docker, proxy, OIDC auth, error handler
- **API generation** — generate API services and models from a Swagger/OpenAPI JSON or YAML source (v2 or v3)
- **File alignment checks** — verify (and fix) consistency between `environment.*.ts` files and i18n translations
- **Plugin system** — install community plugins from configured repos, with version compatibility checks
- **AI devcontainer** — manage a devcontainer for AI-assisted development (start, shell, exec, status, stop, remove)

## Installation

```bash
# From npm
npm install -g ng-keyes

# Or use without install
npx ng-keyes ...
```

## Quick Start

Create a new Angular project with ng-keyes included:

```bash
ng-keyes new my-app
# or, add into an existing project, using the ng CLI:
ng add ng-keyes
```

*The package is saved in `devDependencies` by `ng add`.*

Then:

```bash
cd my-app
ng-keyes serve        # start the app dev server on port 4200
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `ng-keyes new <name>` | `n` | Generate a new Angular project |
| ~~`ng-keyes uiServe`~~ | `us` | :warning: *deprecated* — Start the UI Kit dev server |
| `ng-keyes serve [name]` | `ms` | Start the app dev server |
| `ng-keyes start [name]` | `s` | Start all dev tools (includes the deprecated UI Kit server) |
| `ng-keyes generate [type] [name]` | `g` | Generate a file based on a schematic |
| `ng-keyes install [type]` | `i` | Install a library / system |
| `ng-keyes plugin [repo] [name]` | `p` | Add a plugin from a configured repo |
| `ng-keyes build` | `b` | Build the app into the `dist` folder |
| ~~`ng-keyes style`~~ | — | :warning: *deprecated* — Build styles from the UI Kit |
| `ng-keyes mocks` | — | Generate the mocks system |
| `ng-keyes api <source>` | — | Generate API + models from a Swagger source |
| `ng-keyes check <type>` | — | Check alignment of `environment` or `i18n` files |
| `ng-keyes ai …` | — | Manage the AI devcontainer |
| `ng-keyes --version` | — | Show the CLI banner and version |

### `new`

```bash
ng-keyes new my-app --complete=true
```

| Option | Description | Default |
|--------|-------------|---------|
| ~~`--ui-kit <uiKit>`~~ | :warning: *deprecated* — UI Kit type: `none`, `bootstrap`, `afelio`, `tailwind` | `none` |
| `--open-api` | Create an OpenAPI-based project | `false` |
| `--ng-version <ngVersion>` | Angular version to use | `latest` |
| `--complete <complete>` | Install every module | `false` |
| `--ng <ng>` | Extra standard Angular CLI options, e.g. `--ng="--commit=false --directory=."` | — |

### `serve` / `uiServe` / `start`

```bash
ng-keyes serve            # app on port 4200
ng-keyes start            # start all dev tools (incl. deprecated UI Kit server)
ng-keyes start -e dev -p 4201
```

> ⚠️ `uiServe` and the `--ui-port` / `--ui-ng` options of `start` are **deprecated**.

### `generate`

Generates and/or modifies files based on Angular schematics. Available types:

`module` (`m`), `store` / `ngxs`, `mock` (`mo`), `component` (`c`), `directive` (`d`), `guard` (`g`), `pipe` (`p`), `service` (`s`), `interceptor` (`int`)

```bash
ng-keyes g component my-widget
ng-keyes g ngxs auth
ng-keyes g mock user
```

Extra options are forwarded to the underlying schematic — run without a type to list all available types, or `--help` for usage.

### `install`

Adds ready-made systems to the current project:

| Type | What it installs |
|------|------------------|
| `mocks` | Mocks system |
| `translate` | Translation / i18n system |
| `store` | NGXS store |
| ~~`uikit`~~ | :warning: *deprecated* — UI Kit |
| `docker` | Docker setup |
| `proxy` | Proxy configuration |
| `oidc` | OIDC authentication |
| `error-handler` | Error handler system |

```bash
ng-keyes i oidc
ng-keyes i mocks
```

### `plugin`

Installs a plugin from a repo listed in `plugins.repos` of your `ng-keyes.json` file.

```bash
ng-keyes plugin my-repo my-plugin                # install a plugin
ng-keyes plugin my-repo --list                   # list compatible plugins
ng-keyes plugin my-repo my-plugin --ignored-parts search,pagination --path ./shared/modules
```

Plugin availability is checked against the installed ng-keyes version.

### `build`

```bash
ng-keyes build                        # production build
ng-keyes build -e staging --base-href /my-app/
ng-keyes build --ng="--namedChunks=false --extractLicenses=true"
```

### ~~`style`~~ :warning: *deprecated*

Builds the CSS from the UI Kit (Sass → CSS). Part of the deprecated UI Kit workflow — do not use in new projects.

```bash
ng-keyes style
ng-keyes style -w "projects/ui-kit"   # watch mode
```

### `api`

Generates API services and models from a Swagger/OpenAPI source (JSON or YAML, v2 or v3).

```bash
ng-keyes api ./swagger.json -n api -s 3
ng-keyes api https://api.example.com/v2/api-docs -k myApiKey -p http://proxy:8080
ng-keyes api ./swagger.json -r    # regenerate mode
```

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Name of the API module (default `api`) |
| `-k, --api-key <apiKey>` | Key of the JSON/YAML source |
| `-x, --extract` | Extract the Swagger file into assets |
| `-r, --regenerate` | Use regenerate mode |
| `-s, --api-version <apiVersion>` | Swagger version, `2` or `3` (default `2`) |
| `-p, --proxy <proxy>` | Proxy URL to fetch the Swagger file |

### `check`

Checks alignment between files.

```bash
ng-keyes check environment              # compare environment.*.ts files
ng-keyes check environment -m env.prod.ts   # align everything with the given file
ng-keyes check i18n --fix               # regenerate i18n labels from the main file (default fr.json)
```

### `ai`

Manages the AI devcontainer (creates `.devcontainer/` if missing).

```bash
ng-keyes ai start     # start the AI devcontainer
ng-keyes ai shell     # open a shell inside it
ng-keyes ai exec pi update --all   # run a command inside it
ng-keyes ai status    # show container status
ng-keyes ai stop      # stop it
ng-keyes ai rm -f     # remove it (--force even if running)
```

## Development

To test and debug the local version:

1. Set `production` to `false` in [`config.js`](./config.js)
2. Build the project:

   ```bash
   npm run build
   ```

3. Install it globally:

   ```bash
   npm link
   ```

Other npm scripts:

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript (`tsc`) |
| `npm run watch` | Compile in watch mode (`tsc -w`) |
| `npm run lint` | Run TSLint over the project |
| `npm run cz` | Commit with commitizen |

## Repository Layout

```
.
├── index.js          # CLI entry point (commander program)
├── logic.js          # CLI action implementations
├── config.js         # production flag + package name
├── theme.js          # CLI colors (ansis)
├── collection.json   # Schematics collection manifest
├── schematics/       # Schematics (generators + installers)
├── models/           # Enums and shared models
├── templates/        # Files copied/generated by schematics
├── scripts/          # Build and maintenance scripts
└── .devcontainer/    # AI devcontainer definition
```
