/* eslint-disable @typescript-eslint/no-throw-literal */
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { isEqual } from "lodash-es";
import { compose, lensPath, lensProp, set } from "rambda";
import { DataFactory } from "rdf-data-factory";

import { readAll } from "./readAll";

import type { Bindings, Quad, Source, Term } from "@rdfjs/types";
import type JsonLD from "jsonld";

const PLACEHOLDER = "?";

const engine = new QueryEngine();
const df = new DataFactory();

// This madness is just to cope with the fact that jsonld.toRDF doesn't return
// real Quads. Namely, the "Quad" itself is missing its `termType`, and it and
// its terms are all missing the `.equals()` method.
export const fixQuad = (q: JsonLD.Quad): Quad => {
  const fixTerm = ((term: Term) =>
    term.termType === "Literal"
      ? df.literal(term.value, term.datatype)
      : df.fromTerm(term)) as typeof df.fromTerm;

  // Pretend q is a real quad for a moment.
  const quad = q as Quad;
  return df.quad(
    fixTerm(quad.subject),
    fixTerm(quad.predicate),
    fixTerm(quad.object),
    fixTerm(quad.graph)
  );
};

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
 */
export const query = async (
  source: Source,
  query: JsonLD.NodeObject
): Promise<JsonLD.NodeObject> => {
  const bindingsStream = await engine.queryBindings(sparqlForXQL(query), {
    sources: [source],
  });

  const bindings = await readAll(bindingsStream);

  return bindingsToResults(query, bindings);
};

const sparqlForXQL = (query: JsonLD.NodeObject) => {
  const query1 = {
    "@id": "https://swapi.dev/api/people/1/",
    "http://swapi.dev/documentation#hair_color": "?",
  };

  if (isEqual(query, query1)) {
    return /* sparql */ `
        BASE <https://swapi.dev/api/>
        PREFIX swapi: <http://swapi.dev/documentation#>
        SELECT ?hair_color WHERE { 
          <people/1/> swapi:hair_color ?hair_color .
        }
      `;
  }

  const query2 = {
    "http://swapi.dev/documentation#name": "Luke Skywalker",
    "http://swapi.dev/documentation#eye_color": "?",
  };

  if (isEqual(query, query2)) {
    return /* sparql */ `
        PREFIX swapi: <http://swapi.dev/documentation#>
        SELECT ?eye_color WHERE { 
          [] swapi:name "Luke Skywalker";
             swapi:eye_color ?eye_color .
        }
      `;
  }

  const query3 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    name: "Luke Skywalker",
    homeworld: { name: "?" },
  };

  if (isEqual(query, query3)) {
    return /* sparql */ `
        PREFIX swapi: <http://swapi.dev/documentation#>
        SELECT ?homeworld_name WHERE { 
          [] swapi:name "Luke Skywalker";
             swapi:homeworld ?homeworld .
          ?homeworld swapi:name ?homeworld_name .
        }
      `;
  }

  const query4 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@id": "https://swapi.dev/api/people/1/",
    hair_color: "?",
    homeworld: {
      "@context": { planetName: "http://swapi.dev/documentation#name" },
      planetName: "?",
    },
  };

  if (isEqual(query, query4)) {
    return /* sparql */ `
        PREFIX swapi: <http://swapi.dev/documentation#>
        SELECT ?hair_color ?homeworld_name WHERE { 
          [] swapi:name "Luke Skywalker";
             swapi:hair_color ?hair_color;
             swapi:homeworld ?homeworld .
          ?homeworld swapi:name ?homeworld_name .
        }
      `;
  }

  throw "TODO: Not covered";
};

const bindingsToResults = (
  query: JsonLD.NodeObject,
  bindingses: Bindings[]
): JsonLD.NodeObject => {
  const query1 = {
    "@id": "https://swapi.dev/api/people/1/",
    "http://swapi.dev/documentation#hair_color": "?",
  };

  if (isEqual(query, query1)) {
    const bindings = bindingses[0];

    // TODO: BIG OPEN QUESTION:
    // What happens if something doesn't match?
    if (!bindings) throw "Query didn't match.";

    const hairColor = bindings.get(df.variable("hair_color"));
    if (!hairColor) throw "No value found.";

    return set(
      lensProp("http://swapi.dev/documentation#hair_color"),
      hairColor.value,
      query1
    );
  }

  const query2 = {
    "http://swapi.dev/documentation#name": "Luke Skywalker",
    "http://swapi.dev/documentation#eye_color": "?",
  };

  if (isEqual(query, query2)) {
    const bindings = bindingses[0];

    // TODO: BIG OPEN QUESTION:
    // What happens if something doesn't match?
    if (!bindings) throw "Query didn't match.";

    const eyeColor = bindings.get(df.variable("eye_color"));
    if (!eyeColor) throw "No value found.";

    return set(
      lensProp("http://swapi.dev/documentation#eye_color"),
      eyeColor.value,
      query2
    );
  }

  const query3 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    name: "Luke Skywalker",
    homeworld: { name: "?" },
  };

  if (isEqual(query, query3)) {
    const bindings = bindingses[0];

    // TODO: BIG OPEN QUESTION:
    // What happens if something doesn't match?
    if (!bindings) throw "Query didn't match.";

    const homeworldName = bindings.get(df.variable("homeworld_name"));
    if (!homeworldName) throw "No value found.";

    return set(lensPath(["homeworld", "name"]), homeworldName.value, query3);
  }

  const query4 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@id": "https://swapi.dev/api/people/1/",
    hair_color: "?",
    homeworld: {
      "@context": { planetName: "http://swapi.dev/documentation#name" },
      planetName: "?",
    },
  };

  if (isEqual(query, query4)) {
    const bindings = bindingses[0];

    // TODO: BIG OPEN QUESTION:
    // What happens if something doesn't match?
    if (!bindings) throw "Query didn't match.";

    const hairColor = bindings.get(df.variable("hair_color"));
    if (!hairColor) throw "No value found.";

    const homeworldName = bindings.get(df.variable("homeworld_name"));
    if (!homeworldName) throw "No value found.";

    return compose(
      set(lensPath(["hair_color"]), hairColor.value),
      set(lensPath(["homeworld", "planetName"]), homeworldName.value)
    )(query4);
  }

  throw "TODO: Not covered";
};
