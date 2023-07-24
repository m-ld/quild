import { string, integer, double, boolean } from "./common";

import type * as RDF from "@rdfjs/types";

/**
 * Coverts a Literal to its scalar representation, or `null` if no scalar
 * representation is possible.
 * @param literal A literal to represent.
 */

export const scalarRepresentation = (literal: RDF.Literal) =>
  literal.datatype.equals(string)
    ? literal.value
    : literal.datatype.equals(integer)
    ? parseInt(literal.value)
    : literal.datatype.equals(double)
    ? parseFloat(literal.value)
    : literal.datatype.equals(boolean)
    ? literal.value === "true"
      ? true
      : literal.value === "false"
      ? false
      : null
    : null;
