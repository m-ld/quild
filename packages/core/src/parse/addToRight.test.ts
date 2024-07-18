import { describe, it, expect } from "@jest/globals";

import { addToRight } from "./addToRight";
import { af, df } from "../common";

describe(addToRight, () => {
  it("joins the additional operation to a base join", () => {
    const result = addToRight(
      af.createBgp([
        af.createPattern(
          df.variable("root"),
          df.namedNode("http://swapi.dev/documentation#films"),
          df.variable("root·films")
        ),
      ]),
      af.createJoin([
        af.createJoin([]),
        af.createBgp([
          af.createPattern(
            df.variable("root·films"),
            df.namedNode("http://swapi.dev/documentation#title"),
            df.variable("root·films·title")
          ),
        ]),
      ])
    );

    expect(af.createProject(result, [])).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT * WHERE {
        ?root swapi:films ?root·films.
        ?root·films swapi:title ?root·films·title.
      }
    `);
  });

  it("left-joins the additional operation to a base left-join", () => {
    const result = addToRight(
      af.createBgp([
        af.createPattern(
          df.variable("root"),
          df.namedNode("http://swapi.dev/documentation#films"),
          df.variable("root·films")
        ),
      ]),
      af.createLeftJoin(
        af.createJoin([]),
        af.createBgp([
          af.createPattern(
            df.variable("root·films"),
            df.namedNode("http://swapi.dev/documentation#title"),
            df.variable("root·films·title")
          ),
        ])
      )
    );

    expect(af.createProject(result, [])).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT * WHERE {
        OPTIONAL {
          ?root swapi:films ?root·films.
          ?root·films swapi:title ?root·films·title.
        }
      }
    `);
  });
});
