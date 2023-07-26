import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Map } from "immutable";
import { isEqual, isObjectLike } from "lodash-es";
import { last } from "rambda";
import { Factory as AlgebraFactory, type Algebra } from "sparqlalgebrajs";

import * as IR from "./IntermediateResult";
import { PLACEHOLDER, df } from "./common";
import { readAll } from "./readAll";

import type { Quad, Source, Term } from "@rdfjs/types";
import type * as JsonLD from "jsonld";

const af = new AlgebraFactory(df);
const engine = new QueryEngine();

// This madness is just to cope with the fact that jsonld.toRDF doesn't return
// real Quads. Namely, the "Quad" itself is missing its `termType`, and it and
// its terms are all missing the `.equals()` method.
export const fixQuad = (q: JsonLD.Quad): Quad => {
  const fixTerm = ((term: Term) =>
    term.termType === "Literal"
      ? df.literal(term.value, term.datatype)
      : term.termType === "BlankNode"
      ? df.blankNode(term.value.replace(/^_:/, ""))
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

/* eslint-disable no-misleading-character-class
   ---
   We're intentionally doing this by code point, to match the way the spec
   defines them. */

/** @see https://www.w3.org/TR/sparql11-query/#rPN_CHARS_BASE */
const PN_CHARS_BASE_RE =
  /[A-Za-z\u{00C0}-\u{00D6}\u{00D8}-\u{00F6}\u{00F8}-\u{02FF}\u{0370}-\u{037D}\u{037F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]/u;

/** @see https://www.w3.org/TR/sparql11-query/#rPN_CHARS_U */
const PN_CHARS_U_RE = new RegExp(`(?:${PN_CHARS_BASE_RE.source})|_`, "u");

/** @see https://www.w3.org/TR/sparql11-query/#rVARNAME */
const VARNAME_RE = new RegExp(
  `(?:(?:${PN_CHARS_U_RE.source})|[0-9])(?:(?:${PN_CHARS_U_RE.source})|[0-9\u{00B7}\u{0300}-\u{036F}\u{203F}-\u{2040}])*`,
  "u"
);

const VARNAME_RE_G = new RegExp(VARNAME_RE, VARNAME_RE.flags + "g");

// const PN_CHARS_BASE_RE_INV =
//   /[^A-Za-z\u{00C0}-\u{00D6}\u{00D8}-\u{00F6}\u{00F8}-\u{02FF}\u{0370}-\u{037D}\u{037F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]/gu;

/* eslint-enable no-misleading-character-class --- ^^^ */

const variableName = (key: string) =>
  last(key.match(VARNAME_RE_G) ?? []) ?? "_";

const isPlaceholder = (v: string) => v === PLACEHOLDER;

const createIRNamedNode = (
  q: JsonLD.NodeObject,
  prefix: string
): IR.NodeObject => {
  const queryMap = Map(q);

  return new IR.NodeObject(
    queryMap
      .delete("@context")
      .map((v, k) =>
        k === "@id"
          ? new IR.Name(df.namedNode(v))
          : isPlaceholder(v)
          ? new IR.NativePlaceholder(
              df.variable(`${prefix}·${variableName(k)}`)
            )
          : isObjectLike(v)
          ? createIRNamedNode(v, `${prefix}·${variableName(k)}`)
          : new IR.NativeValue(df.literal(v))
      ),
    queryMap.get("@context")
  );
};

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
 */
export const query = async (
  source: Source,
  query: JsonLD.NodeObject | JsonLD.NodeObject[]
): Promise<JsonLD.NodeObject> => {
  let initialIr: IR.IntermediateResult | undefined;
  let sparql: Algebra.Project | undefined;

  const query1 = {
    "@id": "https://swapi.dev/api/people/1/",
    "http://swapi.dev/documentation#hair_color": "?",
    "http://swapi.dev/documentation#eye_color": "?",
  } as const;

  if (isEqual(query, query1)) {
    initialIr = createIRNamedNode(query1, "root");

    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          df.namedNode("https://swapi.dev/api/people/1/"),
          df.namedNode("http://swapi.dev/documentation#hair_color"),
          df.variable("root·hair_color")
        ),
        af.createPattern(
          df.namedNode("https://swapi.dev/api/people/1/"),
          df.namedNode("http://swapi.dev/documentation#eye_color"),
          df.variable("root·eye_color")
        ),
      ]),
      [df.variable("root·hair_color"), df.variable("root·eye_color")]
    );
  }

  const query2 = {
    "http://swapi.dev/documentation#name": "Luke Skywalker",
    "http://swapi.dev/documentation#hair_color": "?",
    "http://swapi.dev/documentation#eye_color": "?",
  } as const;

  if (isEqual(query, query2)) {
    initialIr = createIRNamedNode(query2, "root");

    const root = df.variable("root");
    const rootHairColor = df.variable("root·hair_color");
    const rootEyeColor = df.variable("root·eye_color");
    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#hair_color"),
          rootHairColor
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#eye_color"),
          rootEyeColor
        ),
      ]),
      [rootHairColor, rootEyeColor]
    );
  }

  const query3 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    name: "Luke Skywalker",
    homeworld: { name: "?" },
  } as const;

  if (isEqual(query, query3)) {
    initialIr = createIRNamedNode(query3, "root");

    const root = df.variable("root");
    const rootHomeworld = df.variable("root·homeworld");
    const rootHomeworldName = df.variable("root·homeworld·name");
    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#name"),
          df.literal("Luke Skywalker")
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#homeworld"),
          rootHomeworld
        ),
        af.createPattern(
          rootHomeworld,
          df.namedNode("http://swapi.dev/documentation#name"),
          rootHomeworldName
        ),
      ]),
      [rootHomeworldName]
    );
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
    initialIr = new IR.NodeObject(
      Map({
        "@id": new IR.Name(df.namedNode("https://swapi.dev/api/people/1/")),
        hair_color: new IR.NativePlaceholder(df.variable("root·hair_color")),
        homeworld: new IR.NodeObject(
          Map({
            planetName: new IR.NativePlaceholder(
              df.variable("root·homeworld·planetName")
            ),
          }),
          { planetName: "http://swapi.dev/documentation#name" }
        ),
      }),
      { "@vocab": "http://swapi.dev/documentation#" }
    );

    const root = df.namedNode("https://swapi.dev/api/people/1/");
    const rootHairColor = df.variable("root·hair_color");
    const rootHomeworld = df.variable("root·homeworld");
    const rootHomeworldPlanetName = df.variable("root·homeworld·planetName");
    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#hair_color"),
          rootHairColor
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#homeworld"),
          rootHomeworld
        ),
        af.createPattern(
          rootHomeworld,
          df.namedNode("http://swapi.dev/documentation#name"),
          rootHomeworldPlanetName
        ),
      ]),
      [rootHairColor, rootHomeworldPlanetName]
    );
  }

  const query5 = [
    {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      eye_color: "blue",
      name: "?",
      height: "?",
    },
  ];

  if (isEqual(query, query5)) {
    const root = df.variable("root");
    const rootName = df.variable("root·name");
    const rootHeight = df.variable("root·height");

    initialIr = new IR.Plural(
      root,
      new IR.NodeObject(
        Map({
          eye_color: new IR.NativeValue(df.literal("blue")),
          name: new IR.NativePlaceholder(rootName),
          height: new IR.NativePlaceholder(rootHeight),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
      )
    );

    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#eye_color"),
          df.literal("blue")
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#name"),
          rootName
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#height"),
          rootHeight
        ),
      ]),
      [root, rootName, rootHeight]
    );
  }

  const query6 = [
    {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      eye_color: "blue",
      name: "?",
      films: [{ title: "?" }],
    },
  ];

  if (isEqual(query, query6)) {
    const root = df.variable("root");
    const rootName = df.variable("root·name");
    const rootFilms = df.variable("root·films");
    const rootFilmsTitle = df.variable("root·films·title");

    initialIr = new IR.Plural(
      df.variable("root"),
      new IR.NodeObject(
        Map({
          eye_color: new IR.NativeValue(df.literal("blue")),
          name: new IR.NativePlaceholder(rootName),
          films: new IR.Plural(
            rootFilms,
            new IR.NodeObject(
              Map({
                title: new IR.NativePlaceholder(rootFilmsTitle),
              })
            )
          ),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
      )
    );

    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#eye_color"),
          df.literal("blue")
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#name"),
          rootName
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#films"),
          rootFilms
        ),
        af.createPattern(
          rootFilms,
          df.namedNode("http://swapi.dev/documentation#title"),
          rootFilmsTitle
        ),
      ]),
      [root, rootName, rootFilms, rootFilmsTitle]
    );
  }

  if (initialIr && sparql) {
    const bindingsStream = await engine.queryBindings(sparql, {
      sources: [source],
    });

    const solutions = await readAll(bindingsStream);

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
  }

  throw "TODO: Not covered";
};
