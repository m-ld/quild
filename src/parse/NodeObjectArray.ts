import { type Parser, nestWarningsUnderKey, isPlainObject } from "./common";
import * as IR from "../IntermediateResult";
import { evolve, prepend } from "../upstream/rambda";

import type * as RDF from "@rdfjs/types";

export const NodeObjectArray: Parser["NodeObjectArray"] = async function ({
  element,
  variable,
  ctx,
}) {
  const soleSubquery = element[0];
  if (!(soleSubquery && element.length === 1)) {
    /* eslint-disable-next-line @typescript-eslint/no-throw-literal
       ---
       TODO: https://github.com/m-ld/quild/issues/15 */
    throw "TODO: Only exactly one subquery is supported in an array, so far.";
  }

  if (!isPlainObject(soleSubquery))
    /* eslint-disable-next-line @typescript-eslint/no-throw-literal
       ---
       TODO: https://github.com/m-ld/quild/issues/15 */
    throw "TODO: Only objects can be in plural nodes, so far.";

  return evolve(
    {
      intermediateResult: (ir) => new IR.Set(variable, ir),
      projections: prepend(variable)<RDF.Variable>,
      warnings: nestWarningsUnderKey(0),
    },
    await this.NodeObject({
      element: soleSubquery,
      variable,
      ctx,
    })
  );
};
