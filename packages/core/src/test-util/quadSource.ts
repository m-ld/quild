import { ArrayIterator } from "asynciterator";

import type * as RDF from "@rdfjs/types";

export const quadSource = (quads: RDF.Quad[]): RDF.Source => ({
  match: (
    subject?: RDF.Term | null,
    predicate?: RDF.Term | null,
    object?: RDF.Term | null,
    graph?: RDF.Term | null
  ) =>
    new ArrayIterator(quads).filter(
      (quad) =>
        (!subject || quad.subject.equals(subject)) &&
        (!predicate || quad.predicate.equals(predicate)) &&
        (!object || quad.object.equals(object)) &&
        (!graph || quad.graph.equals(graph))
    ),
});
