import { describe, expect, it } from "@jest/globals";
import { DataFactory } from "rdf-data-factory";
import { Factory } from "sparqlalgebrajs";

import { runMatcher } from "./runMatcher";
import "./toBeSparqlEqualTo";

const run = runMatcher(expect, "toBeSparqlEqualTo");

const df = new DataFactory();
const af = new Factory(df);

describe("toBeSparqlEqualTo", () => {
  it("matches a SPARQL string to itself", () => {
    const query = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `;

    expect(run(query, query)).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("matches an equivalent SPARQL string", () => {
    const query1 = /* sparql */ `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `;

    const query2 = /* sparql */ `
      SELECT ?s ?p ?o

      WHERE { ?s ?p ?o . }
    `;

    expect(run(query1, query2)).toMatchInlineSnapshot(`"<Pass>"`);
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

    expect(run(query1, query2)).toMatchInlineSnapshot(`
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

    expect(run(query1, query2)).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("fails on non-equivalent strings and algebra", () => {
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
      [df.variable("o"), df.variable("p"), df.variable("s")]
    );

    expect(run(query1, query2)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?o ?p ?s WHERE { ?s ?p ?o. }"
Received: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }""
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

    expect(run(query1, query2)).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("fails on non-equivalent strings and sparqljs", () => {
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
      variables: [df.variable("o"), df.variable("p"), df.variable("s")],
    } as const;

    expect(run(query1, query2)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?o ?p ?s WHERE { ?s ?p ?o. }"
Received: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }""
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

    expect(run(query1, query2)).toMatchInlineSnapshot(`"<Pass>"`);
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
      variables: [df.variable("o"), df.variable("p"), df.variable("s")],
    } as const;

    expect(run(query1, query2)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

Expected: "SELECT ?o ?p ?s WHERE { ?s ?p ?o. }"
Received: "SELECT ?s ?p ?o WHERE { ?s ?p ?o. }""
`);
  });
});
