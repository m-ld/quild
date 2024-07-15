import { describe, it, expect } from "@jest/globals";

import { parser as meldParser } from ".";
import "../../../test-util/toBeSparqlEqualTo";
import * as IR from "../../IntermediateResult";
import { IndexedList } from "../../IntermediateResult/IndexedList";
import { df } from "../../common";
import { parseQuery } from "../../parse";

describe(`${parseQuery.name} with a m-ld parser`, () => {
  it("can query for a @list", async () => {
    const query = {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@id": "https://swapi.dev/api/vehicles/14/",
      pilots: {
        "@list": [{ name: "?" }],
      },
    } as const;

    const { intermediateResult, sparql } = await parseQuery(query, meldParser);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({
          "@vocab": "http://swapi.dev/documentation#",
        }),
        "@id": new IR.LiteralValue("https://swapi.dev/api/vehicles/14/"),
        pilots: new IR.Object({
          "@list": new IndexedList(
            df.variable("root·pilots·slot·index"),
            new IR.Object({
              name: new IR.NativePlaceholder(
                df.variable("root·pilots·slot·item·name")
              ),
            })
          ),
        }),
      })
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX jrql: <http://json-rql.org/#>
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·pilots ?root·pilots·slot·index ?root·pilots·slot·item·name WHERE {
        <https://swapi.dev/api/vehicles/14/> swapi:pilots ?root·pilots.
        ?root·pilots ?root·pilots·rdfLseqSlot ?root·pilots·slot.
        ?root·pilots·slot jrql:index ?root·pilots·slot·index;
                          jrql:item ?root·pilots·slot·item.
        ?root·pilots·slot·item swapi:name ?root·pilots·slot·item·name.
      }
    `);
  });
});
