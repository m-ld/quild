import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import type { Quad, ResultStream, Source, Term } from "@rdfjs/types";
import jsonld from "jsonld";
import { customAlphabet } from "nanoid";
import { DataFactory } from "rdf-data-factory";
import { Algebra, Factory as SparqlFactory } from "sparqlalgebrajs";

const engine = new QueryEngine();
const df = new DataFactory();

// This madness is just to cope with the fact that jsonld.toRDF doesn't return
// real Quads. Namely, the "Quad" itself is missing its `termType`, and it and
// its terms are all missing the `.equals()` method.
export const fixQuad = (q: jsonld.Quad): Quad => {
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

const randomVariableName = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  10
);

const placeholderToVariable = <T extends Term>(term: T) =>
  term.termType === "Literal" && term.value === "?"
    ? df.variable(randomVariableName())
    : term;

const sparqlForXQL = async (query: jsonld.NodeObject) => {
  const sparql = new SparqlFactory();

  const frameRdf = (
    await jsonld.toRDF(query, { produceGeneralizedRdf: true })
  ).map(fixQuad);

  const patterns = frameRdf.map((frameQuad: Quad) =>
    sparql.createPattern(
      // Swap blank nodes out for variables, so the engine resolves actual
      // values for them.
      placeholderToVariable(frameQuad.subject),
      placeholderToVariable(frameQuad.predicate),
      placeholderToVariable(frameQuad.object)
    )
  );

  const algebraQuery: Algebra.Construct = sparql.createConstruct(
    sparql.createBgp(patterns),
    patterns
  );

  return algebraQuery;
};

/**
 * Read all results from an RDF Stream and return them as a promise of an array.
 */
export const readAll = <R>(stream: ResultStream<R>) =>
  new Promise<R[]>((resolve) => {
    const quads: R[] = [];
    stream
      .on("data", (result: R) => {
        quads.push(result);
      })
      .on("end", () => {
        resolve(quads);
      });
  });

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
 */
export const query = async (
  source: Source<Quad>,
  query: jsonld.NodeObject
): Promise<jsonld.NodeObject> => {
  const quadsStream = await engine.queryQuads(await sparqlForXQL(query), {
    sources: [source],
  });

  const quads = await readAll(quadsStream);
  return jsonld.compact(await jsonld.fromRDF(quads), {});
};
