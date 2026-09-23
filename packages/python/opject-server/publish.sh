#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../../.."
uv build --package opject-server --no-sources --out-dir dist/python-server
uv run --locked twine check dist/python-server/*
uv publish dist/python-server/*
