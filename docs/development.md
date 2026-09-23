# Development and modernization

## Repository map

| Package | Implementation | Responsibility |
| --- | --- | --- |
| `packages/javascript/opject-client` | TypeScript, native Node fetch/crypto/VM | Register and retrieve code, verify its SHA-256 digest, instantiate it, and cache registrations |
| `packages/javascript/opject-server` | TypeScript, Express 5, DEON | Authenticated `/register`, `/require`, `/check`, `/remove` endpoints; filesystem or custom storage |
| `packages/python/opject-client` | Python, Requests | Register, retrieve, verify, and instantiate Python objects |
| `packages/python/opject-server` | Python, Flask/Classful | The Python implementation of the JSON endpoints and filesystem storage |
| `packages/registry` | Empty scaffold | Private and excluded from active tooling until application source exists |

Clients execute source supplied by the server. These APIs are intended for trusted code and trusted publishers. The Node VM option provides a separate context, not a security boundary; integrity checks compare a digest with the same server, not with an independent signature. Storage IDs and dependency declarations also come from that trusted source. This tooling migration does not turn the protocol into an untrusted-code execution service.

## Toolchain

- Node 24 is the development default. The supported Node ranges are `^22.18.0 || ^24.11.0 || >=26.0.0`, matching the build tools. See the [Node release schedule](https://nodejs.org/en/about/previous-releases).
- pnpm is pinned to 11.3.0 in `package.json`. Run installs at the repository root; `pnpm-lock.yaml` covers both active JavaScript packages.
- tsdown replaces Rollup, patched TypeScript, path transformers, and the legacy minifier configuration. It emits ESM, CommonJS, declarations, and JavaScript source maps into each package's `distribution/` directory.
- TypeScript 6.0.3 is intentionally pinned: the selected `typescript-eslint` release supports TypeScript below 6.1. Upgrade these together rather than independently moving to TypeScript 7.
- ESLint uses one flat configuration. Vitest runs Node tests without jsdom or a separately started server.
- Python 3.14 is the default; Python 3.11+ is supported. uv manages `uv.lock` and `.venv`. Each Python package uses PEP 621 metadata and Hatchling builds. The original delicense is retained; the inaccurate MIT packaging classifier is removed.

Upstream references: [tsdown output formats](https://tsdown.dev/options/output-format), [uv workspaces](https://docs.astral.sh/uv/concepts/projects/workspaces/), [uv package builds](https://docs.astral.sh/uv/guides/package/).

## Install and check

```sh
npm install --global pnpm@11.3.0
pnpm install --frozen-lockfile
uv sync --locked --all-packages

pnpm check:all
```

Install uv using its [official installation instructions](https://docs.astral.sh/uv/getting-started/installation/). With another supported Python already installed, use `UV_PYTHON=3.12 uv sync --locked --all-packages` and the same environment override for subsequent commands.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Watch and rebuild both JavaScript libraries |
| `pnpm --filter @plurid/opject-client dev` | Watch one library |
| `pnpm test:watch` | Watch behavioral tests |
| `pnpm lint` | Check active JavaScript/TypeScript source and tooling |
| `pnpm typecheck` | Check library, test, and build-configuration types |
| `pnpm test` | Run JavaScript protocol/cache tests |
| `pnpm build` | Build both JavaScript libraries |
| `pnpm check:packages` | Check exports and install tarballs in isolation; test ESM/CommonJS runtime and consumer types |
| `pnpm check` | Run all JavaScript checks, including build and package checks |
| `pnpm python:check` | Run Ruff and pytest |
| `pnpm python:build` | Build both Python wheels and source archives in `dist/` |
| `pnpm check:all` | Run both languages' checks and builds |

The npm package checks need registry access to install production dependencies into a temporary consumer project. JavaScript tests use ephemeral local HTTP ports and temporary storage. Python tests run through Flask's test client with temporary storage. Neither suite needs an external Opject service or credentials.

CI runs on pushes and pull requests, using immutable action pins and frozen/locked installs. JavaScript is checked on Node 22, 24, and 26; Python is checked on 3.11 and 3.14. Python distributions receive metadata validation and a separate wheel-install check. Dependabot is configured for monthly Python dependency and GitHub Action updates.

Update JavaScript dependencies with pnpm and commit the resulting root lockfile. Dependabot's [published support table](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories) currently lists pnpm only through v10, so npm automation is not enabled for this pnpm 11 workspace.

## Package compatibility and migration

The JavaScript default exports and documented class methods remain available:

```js
import Client from '@plurid/opject-client';
import Server from '@plurid/opject-server';
```

```js
const Client = require('@plurid/opject-client');
const Server = require('@plurid/opject-server');
```

The export map routes imports to `.mjs` and require calls to `.cjs`. Use the package name instead of importing internal `distribution` paths. ESM declarations are generated; `source/commonjs.d.cts` files provide thin type aliases for CommonJS consumers. Add aliases there when adding public interfaces. The isolated consumer check covers both `import` and TypeScript's `import = require()` syntax.

Node 12 and Python 3.6 are no longer supported. The client no longer needs `cross-fetch` or `@plurid/plurid-functions` peers; it uses native Node APIs. The server declares its runtime dependencies and uses Express 5's built-in body parsers. Consumers attaching custom Express routes should check the [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html).

Changes needed to make the modern runtime and verification usable:

- The default JavaScript server creates storage directories on first registration, returns a missing-object response after removal, and clears stale dependency metadata.
- JavaScript fetch errors report HTTP status. Cached objects retain dependency metadata, and a zero cache duration disables caching.
- Object dependency resolution works from the consumer's working directory in both ESM and CommonJS. Dependency installation passes arguments directly to the package manager instead of interpolating a shell command.
- Constructing a JavaScript server no longer installs a process-wide SIGINT handler or exits its host process. Applications own shutdown and can call `server.stop()` in their own signal handler.
- Python execution uses an explicit namespace so class lookup and module globals work on current Python versions. Files are read/written as UTF-8 with context managers.
- The old `build.local`, `build.development`, and `build.production` scripts are replaced by `build` and `dev`. Packages are built as libraries; deployment remains the consuming application's responsibility.

- Both servers confine filesystem storage to their storage directories: IDs escaping them (`../`, absolute paths) are refused, nested IDs such as `scope/name` are supported, and missing objects are reported (`404`, `{}`, `checked: false`, `removed: false`) instead of failing with a server error.
- The JavaScript server accepts bodiless requests and content types with parameters (`application/json; charset=utf-8`).
- With `useCache`, the JavaScript client also caches objects it requires, not only those it registers. A cached copy that fails the integrity check is dropped and fetched again.
- The Python server uses all of its custom storage callbacks. Its routes no longer redirect to a trailing slash, and `close()`, called from another thread, stops a server started with `start()`. In debug mode `start()` still uses Flask's reloader, which cannot be closed. Production deployments can serve `server.app` with a WSGI server.
- The Python client finds the first top-level class, including classes with base classes, and reports a missing class. Its requests time out (default `30` seconds) and raise on HTTP errors.

## Release preparation

Run `pnpm check:all` before preparing a release, and bump each package's version intentionally. No CI step publishes a package.

```sh
pnpm --filter @plurid/opject-client pack
pnpm --filter @plurid/opject-server pack
uv build --all-packages --no-sources
uv run --locked twine check dist/*
```

The JavaScript `prepack` hooks build their package; `prepublishOnly` runs the complete JavaScript checks. Python's `publish.sh` helpers build, validate, and then publish only their own package. Running those helpers uploads to PyPI; use the build commands above for local artifacts.
