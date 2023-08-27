import { isArray } from "lodash-es";

import { isPlainObject, type Parsed, type ToParse } from "./common";
import { parseDocument } from "./parseDocument";
import { isLiteral, parsePrimitive } from "./parseNodeObject";

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
export const parseIriEntryPosition = async ({
  element,
  variable,
  ctx,
}: ToParse): Promise<Parsed> => {
  let parsedChild;

  if (isLiteral(element)) {
    parsedChild = parsePrimitive({ element, variable, ctx });
  } else if (isArray(element) || isPlainObject(element)) {
    // TODO:
    parsedChild = await parseDocument({
      element,
      variable,
      ctx,
    });
  } else {
    throw "TODO: Not yet covered";
  }
  return parsedChild;
};
