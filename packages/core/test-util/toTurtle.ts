import * as N3 from "n3";

import type * as RDF from "@rdfjs/types";

/**
 * Converts an RDF stream to a string of Turtle. Mainly useful for debugging.
 * @param stream The RDF stream to convert.
 * @param options
 * @param options.prefixes The prefixes to use.
 * @returns A promise that resolves with the Turtle string.
 */
export const toTurtle = (
  stream: RDF.Stream,
  { prefixes }: Pick<N3.WriterOptions, "prefixes"> = {}
) =>
  new Promise((resolve) => {
    let turtleCode = "";
    const streamWriter = new N3.StreamWriter({ prefixes });

    streamWriter.on("data", (data: string) => {
      turtleCode += data;
    });

    streamWriter.on("end", () => {
      resolve(turtleCode);
    });

    streamWriter.import(stream);
  });
