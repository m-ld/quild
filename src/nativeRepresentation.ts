import { string, integer, double, boolean } from "./common";

import type * as RDF from "@rdfjs/types";

/**
 * Coverts a Literal to its JSON-native representation, or `undefined` if no
 * native representation is possible.
 * @param term A term to represent.
 */
const nativeRepresentation = (term: RDF.Term) =>
  term.termType === "Literal"
    ? term.datatype.equals(string)
      ? term.value
      : term.datatype.equals(integer)
      ? parseInt(term.value)
      : term.datatype.equals(double)
      ? parseFloat(term.value)
      : term.datatype.equals(boolean)
      ? term.value === "true"
        ? true
        : term.value === "false"
        ? false
        : undefined
      : undefined
    : undefined;

export default nativeRepresentation;
