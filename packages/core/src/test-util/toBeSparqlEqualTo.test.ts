import { describe, expect, it } from "@jest/globals";
import { DataFactory } from "rdf-data-factory";
import { Factory as AlgebraFactory } from "sparqlalgebrajs";

import { matcherResult } from "./matcherResult";

const df = new DataFactory();
const af = new AlgebraFactory(df);

describe("toBeSparqlEqualTo", () => {
  it("matches a SPARQL string to itself", () => {
    const query = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `;

    expect(
      matcherResult(() => {
        expect(query).toBeSparqlEqualTo(query);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("matches an equivalent SPARQL string", () => {
    const query1 = /* sparql */ `
      BASE <http://example.com/>
      SELECT ?name
      WHERE {
         <alice> <http://xmlns.com/foaf/0.1/name> ?name .
      }
    `;

    const query2 = /* sparql */ `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      
      SELECT ?name
      WHERE { <http://example.com/alice> foaf:name ?name . }
    `;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("uses the expected value's prefixes and base in the output", () => {
    const query1 = /* sparql */ `
      BASE <http://example.com/>
      SELECT ?name
      WHERE {
         <alice> <http://xmlns.com/foaf/0.1/homepage> ?name .
      }
    `;

    const query2 = /* sparql */ `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      
      SELECT ?name
      WHERE { <http://example.com/alice> foaf:name ?name . }
    `;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 1
+ Received  + 1

  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
- SELECT ?name WHERE { <http://example.com/alice> foaf:name ?name. }
+ SELECT ?name WHERE { <http://example.com/alice> foaf:homepage ?name. }"
`);
  });

  it("fails on non-equivalent SPARQL strings", () => {
    const query1 = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `;

    const query2 = /* sparql */ `
      SELECT ?s ?p ?o

      WHERE { ?o ?p ?s . }
    `;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?s ?p ?o WHERE { ?o ?p ?s. }"
Received: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }""
`);
  });

  it("matches equivalent strings and algebra", () => {
    const query1 = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `;

    const query2 = af.createProject(
      af.createBgp([
        af.createPattern(df.variable("s"), df.variable("p"), df.variable("o")),
      ]),
      [df.variable("s"), df.variable("p"), df.variable("o")]
    );

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("fails on non-equivalent strings and algebra", () => {
    const query1 = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?something ?pretty ?off .
      }
    `;

    const query2 = af.createProject(
      af.createBgp([
        af.createPattern(df.variable("s"), df.variable("p"), df.variable("o")),
      ]),
      [df.variable("s"), df.variable("p"), df.variable("o")]
    );

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }"
Received: "SELECT ?s ?p ?o WHERE { ?something ?pretty ?off. }""
`);
  });

  it("matches equivalent strings and sparqljs", () => {
    const query1 = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `;

    const query2 = {
      type: "query",
      prefixes: {},
      queryType: "SELECT",
      variables: [df.variable("s"), df.variable("p"), df.variable("o")],
      where: [
        {
          type: "bgp",
          triples: [
            {
              subject: df.variable("s"),
              predicate: df.variable("p"),
              object: df.variable("o"),
            },
          ],
        },
      ],
    } as const;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("fails on non-equivalent strings and sparqljs", () => {
    const query1 = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?something ?pretty ?off .
      }
    `;

    const query2 = {
      type: "query",
      prefixes: {},
      queryType: "SELECT",
      where: [
        {
          type: "bgp",
          triples: [
            {
              subject: df.variable("s"),
              predicate: df.variable("p"),
              object: df.variable("o"),
            },
          ],
        },
      ],
      variables: [df.variable("s"), df.variable("p"), df.variable("o")],
    } as const;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }"
Received: "SELECT ?s ?p ?o WHERE { ?something ?pretty ?off. }""
`);
  });

  it("matches equivalent algebra and sparqljs", () => {
    const query1 = af.createProject(
      af.createBgp([
        af.createPattern(df.variable("s"), df.variable("p"), df.variable("o")),
      ]),
      [df.variable("s"), df.variable("p"), df.variable("o")]
    );

    const query2 = {
      type: "query",
      prefixes: {},
      queryType: "SELECT",
      variables: [df.variable("s"), df.variable("p"), df.variable("o")],
      where: [
        {
          type: "bgp",
          triples: [
            {
              subject: df.variable("s"),
              predicate: df.variable("p"),
              object: df.variable("o"),
            },
          ],
        },
      ],
    } as const;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("fails on non-equivalent algebra and sparqljs", () => {
    const query1 = af.createProject(
      af.createBgp([
        af.createPattern(df.variable("s"), df.variable("p"), df.variable("o")),
      ]),
      [df.variable("s"), df.variable("p"), df.variable("o")]
    );

    const query2 = {
      type: "query",
      prefixes: {},
      queryType: "SELECT",
      where: [
        {
          type: "bgp",
          triples: [
            {
              subject: df.variable("s"),
              predicate: df.variable("p"),
              object: df.variable("o"),
            },
          ],
        },
      ],
      variables: [df.variable("s")],
    } as const;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?s WHERE { ?s ?p ?o. }"
Received: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }""
`);
  });

  it("matches BGPs in any order", () => {
    const query1 = /* sparql */ `
      BASE <http://example.com/>
      SELECT ?name ?homepage
      WHERE {
         <alice> <http://xmlns.com/foaf/0.1/name> ?name .
         <alice> <http://xmlns.com/foaf/0.1/homepage> ?homepage .
      }
    `;

    const query2 = /* sparql */ `
      BASE <http://example.com/>
      SELECT ?name ?homepage
      WHERE {
         <alice> <http://xmlns.com/foaf/0.1/homepage> ?homepage .
         <alice> <http://xmlns.com/foaf/0.1/name> ?name .
      }
    `;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("matches projections in any order", () => {
    const query1 = /* sparql */ `
      BASE <http://example.com/>
      SELECT ?name ?homepage
      WHERE {
         <alice> <http://xmlns.com/foaf/0.1/name> ?name .
         <alice> <http://xmlns.com/foaf/0.1/homepage> ?homepage .
      }
    `;

    const query2 = /* sparql */ `
      BASE <http://example.com/>
      SELECT ?homepage ?name
      WHERE {
         <alice> <http://xmlns.com/foaf/0.1/name> ?name .
         <alice> <http://xmlns.com/foaf/0.1/homepage> ?homepage .
      }
    `;

    expect(
      matcherResult(() => {
        expect(query1).toBeSparqlEqualTo(query2);
      })
    ).toMatchInlineSnapshot(`"<Pass>"`);
  });
});
