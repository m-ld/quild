declare module "@graphy/memory.dataset.fast" {
  import type { Duplex } from "node:stream";

  import type { BaseQuad, Dataset, Quad, Stream, Term } from "@rdfjs/types";

  class FastDataset<
      OutQuad extends BaseQuad = Quad,
      InQuad extends BaseQuad = OutQuad
    >
    extends Duplex
    implements Dataset<OutQuad, InQuad>
  {
    protected offspring(h_quad_tree: unknown): this;

    // The methods on Dataset which return new datasets (rather than mutating the
    // current one) are only required by the Dataset spec to return objects which
    // conform to Dataset. FastDataset's implementation specifically returns more
    // FastDatasets. In particular, that means the returned datasets can be used
    // as Duplex (readable and writable) streams. These typings tell TypeScript
    // about that.

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

    // More from Dataset
    addAll(quads: Dataset<InQuad> | InQuad[]): this;
    contains(other: Dataset<InQuad>): boolean;
    deleteMatches(
      subject?: Term,
      predicate?: Term,
      object?: Term,
      graph?: Term
    ): this;
    equals(other: Dataset<InQuad>): boolean;
    every(iteratee: (quad: OutQuad, dataset: this) => boolean): boolean;
    forEach(callback: (quad: OutQuad, dataset: this) => void): void;
    import(stream: Stream<InQuad>): Promise<this>;
    reduce<A = unknown>(
      callback: (accumulator: A, quad: OutQuad, dataset: this) => A,
      initialValue?: A
    ): A;
    some(iteratee: (quad: OutQuad, dataset: this) => boolean): boolean;
    toArray(): OutQuad[];
    toCanonical(): string;
    toStream(): Stream<OutQuad>;
    toString(): string;

    // DatasetCore
    readonly size: number;
    add(quad: InQuad): this;
    delete(quad: InQuad): this;
    has(quad: InQuad): boolean;
    [Symbol.iterator](): Iterator<OutQuad>;
  }

  const dataset: (<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad
  >() => FastDataset<OutQuad, InQuad>) & { keys: symbol; quads: symbol };

  export default dataset;
  export type { FastDataset };
}
