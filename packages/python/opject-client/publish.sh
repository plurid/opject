#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../../.."
uv build --package opject-client --no-sources --out-dir dist/python-client
uv run --locked twine check dist/python-client/*
uv publish dist/python-client/*
