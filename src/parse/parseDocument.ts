import { isArray } from "lodash-es";

import {
  isPlainObject,
  parsed,
  parseWarning,
  type Parsed,
  type ToParse,
} from "./common";
import { parseNodeObject } from "./parseNodeObject";
import { parseNodeObjectArray } from "./parseNodeObjectArray";
import { parseTopLevelGraphContainer } from "./parseTopLevelGraphContainer";
import * as IR from "../IntermediateResult";

import type { JsonObject } from "type-fest";

const isTopLevelGraphContainer = (element: JsonObject) =>
  // "a map consisting of only the entries `@context` and/or `@graph`"
  !Object.keys(element).some((key) => !["@context", "@graph"].includes(key));

/**
 * Parse a JSON-LD Document.
 *
 * @see https://www.w3.org/TR/json-ld11/#json-ld-grammar
 *
 * > A [JSON-LD document][1] _MUST_ be a single [node object][2], a [map][3]
 * > consisting of only the [entries][4] `@context` and/or `@graph`, or an
 * > [array][5] of zero or more [node objects][2].
 * >
 * > [1]: https://www.w3.org/TR/json-ld11/#dfn-json-ld-document
 * > [2]: https://www.w3.org/TR/json-ld11/#dfn-node-object
 * > [3]: https://infra.spec.whatwg.org/#ordered-map
 * > [4]: https://infra.spec.whatwg.org/#map-entry
 * > [5]: https://infra.spec.whatwg.org/#list
 */
export const parseDocument = async ({
  element,
  variable,
  ctx,
}: ToParse): Promise<Parsed> => {
  if (isArray(element)) {
    return parseNodeObjectArray({ element, variable, ctx });
  } else if (isPlainObject(element)) {
    if (isTopLevelGraphContainer(element)) {
      return parseTopLevelGraphContainer({ element, variable, ctx });
    } else {
      return parseNodeObject({ element, variable, ctx });
    }
  } else {
    return parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "Expected Document to be a Node Object, an array of Node Objects, or a top-level @graph container.",
        }),
      ],
    });
  }
};
