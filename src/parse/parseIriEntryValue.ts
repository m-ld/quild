import { isArray, isNull } from "lodash-es";

import { isPlainObject, parsed, parseWarning, type Parser } from "./common";
import { parseDocument } from "./parseDocument";
import { parseGraphObject } from "./parseGraphObject";
import { parseListObject } from "./parseListObject";
import { isLiteral, parseNodeObject, parsePrimitive } from "./parseNodeObject";
import { parseSetObject } from "./parseSetObject";
import { parseValueObject } from "./parseValueObject";
import * as IR from "../IntermediateResult";

/**
 * Parse a JSON-LD node object IRI entry position.
 *
 * @see https://www.w3.org/TR/json-ld11/#node-objects
 *
 * > Keys in a [node object][1] that are not [keywords][2] _MAY_ expand to an
 * > [IRI][3] using the [active context][4]. The values associated with keys
 * > that expand to an [IRI][3] _MUST_ be one of the following: [...]
 * >
 * > [1]: https://www.w3.org/TR/json-ld11/#dfn-node-object
 * > [2]: https://www.w3.org/TR/json-ld11/#dfn-keyword
 * > [3]: https://tools.ietf.org/html/rfc3987#section-2
 * > [4]: https://www.w3.org/TR/json-ld11/#dfn-active-context
 */
export const parseIriEntryValue: Parser = async ({
  element,
  variable,
  ctx,
}) => {
  if (isLiteral(element)) {
    return parsePrimitive({ element, variable, ctx });
  } else if (isPlainObject(element)) {
    if ("@graph" in element) {
      return parseGraphObject({ element, variable, ctx });
    } else if ("@value" in element) {
      return parseValueObject({ element, variable, ctx });
    } else if ("@list" in element) {
      return parseListObject({ element, variable, ctx });
    } else if ("@set" in element) {
      return parseSetObject({ element, variable, ctx });
    } else {
      return parseNodeObject({
        element,
        variable,
        ctx,
      });
    }
  } else if (isArray(element)) {
    return parseDocument({
      element,
      variable,
      ctx,
    });
  } else if (isNull(element)) {
    return parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message: "null values are not yet supported",
        }),
      ],
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw "TODO: Not yet covered";
  }
};
