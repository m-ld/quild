import { isNumber, isString } from "lodash-es";

import { string, integer, double, boolean, df } from "./common";

import type * as RDF from "@rdfjs/types";

/**
 * Coverts a Literal to its JSON-native representation, or `undefined` if no
 * native representation is possible.
 * @param term A term to represent.
 */
export const toJSONNative = (term: RDF.Term) =>
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

/**
 * Coverts a JSON-native value to an RDF literal.
 * @param value A value to represent.
 */
export const toRdfLiteral = (value: string | number | boolean) =>
  isString(value)
    ? df.literal(value)
    : isNumber(value)
    ? Number.isInteger(value)
      ? df.literal(value.toString(), integer)
      : df.literal(value.toString(), double)
    : df.literal(value.toString(), boolean);
