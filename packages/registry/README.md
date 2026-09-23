# Opject registry

This directory is reserved for the registry application. Its only source file is `source/.gitkeep`; no UI or server implementation is present in this checkout.

The package is private and excluded from the active pnpm workspace and CI. The obsolete webpack/Rollup/Jest scripts, Node 14 Dockerfile, dependencies, and lockfile were retired during the build modernization. Their history remains in git.

Restore or implement the application source before choosing its framework and adding a build or deployment pipeline. The working object-passing libraries are documented in the [root README](../../README.md).
