# The URL prefix for SWAPI.
prefix="https://swapi.dev/api/"

# The URLs of the resources to fetch, relative to the prefix.
resources=(
  people/1
  people/6
  people/18
  planets/1
  films/1
  films/2
  films/3
  films/4
  films/5
  films/6
  vehicles/14
)

# Do everything in the fixtures directory.
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

read -r -d '' JQ <<'EOF'
# Mapping of URL segments to type names
{
  "people": "Person",
  "planets": "Planet",
  "films": "Film",
  "vehicles": "Vehicle"
} as $types |

# Add a @type to each object
[inputs] |
map(
  {
    "@type": $types[.url | capture("https://swapi.dev/api/(?<type>[^/]*)/.*") | .type],
  } + .
) |
{
  "@context": $context,
  "@graph": .
}
EOF

(
  for resource in "${resources[@]}"; do
    curl -s "$prefix$resource"
  done
) | jq -n \
  --slurpfile context context.json "$JQ" >data.json
