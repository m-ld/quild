declare module "@graphy/memory.dataset.fast" {
  import type { Duplex } from "node:stream";

  import type { Dataset } from "@rdfjs/types";

  class FastDataset extends Duplex {
    protected offspring(h_quad_tree: unknown = null): this;
  }

  // The methods on Dataset which return new datasets (rather than mutating the
  // current one) are only required by the Dataset spec to return objects which
  // conform to Dataset. FastDataset's implementation specifically returns more
  // FastDatasets. In particular, that means the returned datasets can be used
  // as Duplex (readable and writable) streams. These typings tell TypeScript
  // about that.
  interface FastDataset<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad
  > extends Dataset<OutQuad, InQuad> {
    difference(other: Dataset<InQuad>): this;

    filter(iteratee: (quad: OutQuad, dataset: this) => boolean): this;

    intersection(other: Dataset<InQuad>): this;

    map(iteratee: (quad: OutQuad, dataset: Dataset<OutQuad>) => OutQuad): this;

    union(quads: Dataset<InQuad>): this;

    match(
      subject?: Term | null,
      predicate?: Term | null,
      object?: Term | null,
      graph?: Term | null
    ): this;
  }

  const dataset: (<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad
  >() => FastDataset<OutQuad, InQuad>) & { keys: symbol; quads: symbol };

  export default dataset;
  export type { FastDataset };
}
