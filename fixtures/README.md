# SWAPI fixture data for tests

The tests in this repo use data from [SWAPI, the Star Wars API](https://swapi.dev/). It's a convenient source of various kinds of data most people have some kind of knowledge of already, and it exposes JSON which, while not quite JSON-LD, is easy enough to turn into JSON-LD by adding a context.

The fixture data is checked in as `data.json`, so there's no need to fetch it all the time and no risk of tests failing because the remote data changes. To regenerate the data at any time, run `./fetchSwapiData.sh`. To add new data to the fixtures, add a new resource URL at the top of that script, and re-run it.
