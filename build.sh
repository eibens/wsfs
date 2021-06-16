#!/bin/bash

# Exit if one command fails.
set -e

COV_DIR=".cov"
COV_FILE="mod.lcov"

# Lint and format.
deno lint
deno fmt --check

# Run tests and generate coverage profile.
deno test -A --unstable --coverage=$COV_DIR

# Print coverage info to stdout.
deno coverage --unstable $COV_DIR

# Only run this from GitHub Actions.
if [ "$CI" = true ]; then

  # Generate coverage file.
  deno coverage --lcov $COV_DIR > $COV_FILE

  # Upload coverage file.
  bash <(curl -s https://codecov.io/bash) -f $COV_FILE

  # Delete coverage file.
  rm -f $COV_FILE
fi

# Delete coverage data
rm -rf $COV_DIR
