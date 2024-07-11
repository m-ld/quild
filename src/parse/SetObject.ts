import { type Parser, nestWarningsUnderKey } from "./common";
import * as IR from "../IntermediateResult";
import { evolve } from "../upstream/rambda";

/**
 * Parse a Set Object.
 *
 * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
 *
 * > A set object MUST be a map that contains no keys that expand to an IRI or
 * > keyword other than @set and @index. Please note that the @index key will be
 * > ignored when being processed.
 */
export const SetObject: Parser["SetObject"] = async function ({
  element,
  variable,
  ctx,
}) {
  return evolve(
    {
      intermediateResult: (ir) => new IR.Object({ "@set": ir }),
      warnings: nestWarningsUnderKey("@set"),
    },
    await this.NodeObjectArray({
      element: element["@set"],
      variable,
      ctx,
    })
  );
};
