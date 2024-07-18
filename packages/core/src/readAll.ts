import type { ResultStream } from "@rdfjs/types";

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
