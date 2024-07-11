import { isArray } from "lodash-es";

import { isPlainObject, parsed, parseWarning, type Parser } from "./common";
import { isTopLevelGraphContainer } from "./common";
import * as IR from "../IntermediateResult";

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
export const Document: Parser["Document"] = async function ({
  element,
  variable,
  ctx,
}) {
  if (isArray(element)) {
    return this.NodeObjectArray({ element, variable, ctx });
  } else if (isPlainObject(element)) {
    if (isTopLevelGraphContainer(element)) {
      return this.TopLevelGraphContainer({ element, variable, ctx });
    } else {
      return this.NodeObject({ element, variable, ctx });
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
