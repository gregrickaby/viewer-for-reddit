#!/usr/bin/env bash
# Prints a hash of the working tree: tracked changes against HEAD plus the
# contents of untracked, non-ignored files. code-review records it on a pass,
# and commit compares it before committing.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
{
  git rev-parse HEAD
  git diff HEAD --binary
  git ls-files --others --exclude-standard -z | xargs -0 shasum
} | shasum | cut -d' ' -f1
