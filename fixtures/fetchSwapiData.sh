#!/bin/bash

# The URL prefix for SWAPI.
prefix="https://swapi.dev/api/"

# The URLs of the resources to fetch, relative to the prefix.
resources=(
  people/1
  planets/1
)

# Do everything in the fixtures directory.
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

(
  for resource in "${resources[@]}"; do
    curl -s "$prefix$resource"
  done
) | jq -n \
  --slurpfile context context.json \
  '{"@context": $context, "@graph": [inputs]}' \
  >data.json
