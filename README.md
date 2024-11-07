# revortex

[Same page on russian.](docs/README.ru.md)

Utility for automatic generation of API client from [Nest](https://nestjs.com/) project source code.
Designed for use inside a monorepository and does not require manual description of response options and parameters in controllers.

## Principle

The package creates a small typed wrapper for each method in the controller and reuses their types - this allows the application to work with minimal configuration.
For the same reason, there is a limitation - imports must be configured between applications, so revortex can primarily be used in monorepositories.

## Installation

The application must be installed in the client-side repository:

```shell
# The code generator itself
pnpm add -D revortex
# A small wrapper for working in runtime
pnpm add revortex-wrapper
```

## Configuration and startup

Create a `revortex.json` file in the root of the project and set the required fields:

### repo

Link to the root directory of the project's Nest repository, e.g. `../server/` if the server and client repositories are on the same level.

### outDir.

A reference to the directory where the final client will be saved, e.g. `./lib/`.

### importAliasSrcDir (optional)

Path alias (if configured) to the `src` directory of the server side, will help set up more explicit and shorter imports. By default is built from `repo` and `sourceDir`, such as `../server/src/`.

### sourceDir (optional)

If when building Nest application you have organized the location of modules differently from the starting template, you need to specify the path to the directory that contains the modules, relative to the root directory of the server part of the application. The default is `src/`.

A normal `revortex.json` file looks like this:

```json
{
  "repo": "../server/",
  "outDir": "./lib/",
  "importAliasSrcDir": "~server/"
}
```

### Run

The application should be run from the same directory as the configuration file:

```shell
pnpm exec revortex
```

Additionally, you can register a command in Taskfile to run the generation from any directory and in a standardized way:

```yaml
version: '3'

vars:
  WEB_PATH: ./apps/web

tasks:
  generate-api:
    dir: “{{.WEB_PATH}}”
    cmds:
      - pnpm exec revortex
      - prettier -w ./lib/index.ts
```
```shell
task generate-api
```

## Usage

Now we need to create an instance of `api` using the out-of-the-box utility and the `ky` package:

```typescript
import ky from 'ky'
import { apiCall } from 'revortex-wrapper'
import { createApi } from '../lib'

const api = createApi(ky, apiCall)
await api.AppController.getHello({})
```

At this point, an instance of `ky` is needed to create the wrapper, since the wrapper itself is built on interaction with this package.

## Roadmap

- [ ] Add support for `axios` to create a wrapper
- [ ] Add support for `fetch` to create a wrapper.
- [ ] Add support for parameters at application startup instead of configuration file