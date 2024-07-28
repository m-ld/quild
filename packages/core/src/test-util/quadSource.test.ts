import { describe, expect, it } from "@jest/globals";

import { quadSource } from "./quadSource";
import { df } from "../common";
import { readAll } from "../readAll";

describe(quadSource, () => {
  it("returns a source containing the given quads", async () => {
    const quads = [
      df.quad(
        df.namedNode("s"),
        df.namedNode("p"),
        df.namedNode("o"),
        df.defaultGraph()
      ),
    ];

    const src = quadSource(quads);

    expect(await readAll(src.match())).toEqual(quads);
  });

  it("filters quads", async () => {
    const quads = [
      df.quad(
        df.namedNode("s1"),
        df.namedNode("p1"),
        df.namedNode("o1"),
        df.defaultGraph()
      ),
      df.quad(
        df.namedNode("s1"),
        df.namedNode("p2"),
        df.namedNode("o2"),
        df.defaultGraph()
      ),
      df.quad(
        df.namedNode("s2"),
        df.namedNode("p2"),
        df.namedNode("o3"),
        df.defaultGraph()
      ),
      df.quad(
        df.namedNode("s2"),
        df.namedNode("p2"),
        df.namedNode("o4"),
        df.defaultGraph()
      ),
    ];

    const src = quadSource(quads);

    expect(await readAll(src.match(df.namedNode("s1")))).toEqual([
      quads[0],
      quads[1],
    ]);

    expect(await readAll(src.match(null, df.namedNode("p2")))).toEqual([
      quads[1],
      quads[2],
      quads[3],
    ]);

    expect(
      await readAll(src.match(df.namedNode("s2"), df.namedNode("p2")))
    ).toEqual([quads[2], quads[3]]);
  });
});
