// TODO: Test
import { last } from "lodash-es";

import { df } from "./common";

import type * as RDF from "@rdfjs/types";

/* eslint-disable no-misleading-character-class
   ---
   We're intentionally doing this by code point, to match the way the spec
   defines them. */

/** @see https://www.w3.org/TR/sparql11-query/#rPN_CHARS_BASE */
const PN_CHARS_BASE_RE =
  /[A-Za-z\u{00C0}-\u{00D6}\u{00D8}-\u{00F6}\u{00F8}-\u{02FF}\u{0370}-\u{037D}\u{037F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]/u;

/** @see https://www.w3.org/TR/sparql11-query/#rPN_CHARS_U */
const PN_CHARS_U_RE = new RegExp(`(?:${PN_CHARS_BASE_RE.source})|_`, "u");

/** @see https://www.w3.org/TR/sparql11-query/#rVARNAME */
const VARNAME_RE = new RegExp(
  `(?:(?:${PN_CHARS_U_RE.source})|[0-9])(?:(?:${PN_CHARS_U_RE.source})|[0-9\u{00B7}\u{0300}-\u{036F}\u{203F}-\u{2040}])*`,
  "u"
);

/* eslint-enable no-misleading-character-class --- ^^^ */

/** Makes a global version of a given RegExp. */
const globalize = (regexp: RegExp) => new RegExp(regexp, regexp.flags + "g");

/** Returns a suitable variable name for a given key. */
const variableName = (key: string) =>
  last(key.match(globalize(VARNAME_RE)) ?? []) ?? "_";

/**
 * Creates and returns a variable "nested" under the given parent.
 * @param parent The parent variable.
 * @param key The key to base the name on.
 */
export const variableUnder = (parent: RDF.Variable, key: string) =>
  df.variable(`${parent.value}·${variableName(key)}`);
