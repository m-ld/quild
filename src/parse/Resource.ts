import { isString, isNumber, isBoolean, isArray, isNull } from "lodash-es";

import { type Parser, isPlainObject, parsed, parseWarning } from "./common";
import * as IR from "../IntermediateResult";
import { anyPass } from "../upstream/rambda";

const isLiteral = anyPass([isString, isNumber, isBoolean]);

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
export const Resource: Parser["Resource"] = async function ({
  element,
  variable,
  ctx,
}) {
  if (isLiteral(element)) {
    return this.Primitive({ element, variable, ctx });
  } else if (isPlainObject(element)) {
    if ("@graph" in element) {
      return this.GraphObject({ element, variable, ctx });
    } else if ("@value" in element) {
      return this.ValueObject({ element, variable, ctx });
    } else if ("@list" in element) {
      return this.ListObject({ element, variable, ctx });
    } else if ("@set" in element) {
      return this.SetObject({ element, variable, ctx });
    } else {
      return this.NodeObject({
        element,
        variable,
        ctx,
      });
    }
  } else if (isArray(element)) {
    return this.NodeObjectArray({
      element,
      variable,
      ctx,
    });
  } else if (isNull(element)) {
    return parsed({
      intermediateResult: new IR.LiteralValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message: "null values are not yet supported",
        }),
      ],
    });
  } else {
    return parsed({
      intermediateResult: new IR.LiteralValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message: "Unsupported element parsed as a Resource",
        }),
      ],
    });
  }
};
