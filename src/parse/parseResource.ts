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
 * Parse a JSON-LD Resource (in RDF parlance, anything which may be the object
 * of a statement).
 *
 * @see https://www.w3.org/TR/json-ld11/#dfn-resource
 *
 * > A [resource][1] denoted by an [IRI][2], a [blank
 * > node][3] or [literal][4] representing something in the world (the "universe
 * > of discourse").
 * >
 * > [1]: https://www.w3.org/TR/rdf11-concepts/#dfn-resource
 * > [2]: https://tools.ietf.org/html/rfc3987#section-2
 * > [3]: https://www.w3.org/TR/rdf11-concepts/#dfn-blank-node
 * > [4]: https://www.w3.org/TR/rdf11-concepts/#dfn-literal
 */
export const parseResource: Parser = async ({ element, variable, ctx }) => {
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
