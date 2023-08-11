#!/bin/bash

# The URL prefix for SWAPI.
prefix="https://swapi.dev/api/"

# The URLs of the resources to fetch, relative to the prefix.
resources=(
  people/1
  people/6
  planets/1
  films/1
  films/2
  films/3
  films/4
  films/5
  films/6
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
