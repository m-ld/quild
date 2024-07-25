import {
  type Parser,
  nestWarningsUnderKey,
  isPlainObject,
  Parsed,
} from "./common";
import * as IR from "../IntermediateResult";
import { af } from "../common";
import { evolve, prepend } from "../upstream/rambda";

import { identity } from "rambdax";

export const NodeObjectArray: Parser["NodeObjectArray"] = async function ({
  element,
  variable,
  ctx,
}) {
  const soleSubquery = element[0];
  if (!(soleSubquery && element.length === 1)) {
    /* eslint-disable-next-line @typescript-eslint/only-throw-error
       ---
       TODO: https://github.com/m-ld/quild/issues/15 */
    throw "TODO: Only exactly one subquery is supported in an array, so far.";
  }

  if (!isPlainObject(soleSubquery))
    /* eslint-disable-next-line @typescript-eslint/only-throw-error
       ---
       TODO: https://github.com/m-ld/quild/issues/15 */
    throw "TODO: Only objects can be in plural nodes, so far.";

  const parsedSubquery = await this.NodeObject({
    element: soleSubquery,
    variable,
    ctx,
  });

  return evolve(
    {
      intermediateResult: (ir) => new IR.Set(parsedSubquery.term, ir),
      projections:
        parsedSubquery.term.termType === "Variable"
          ? prepend(parsedSubquery.term)
          : identity<Parsed["projections"]>,
      warnings: nestWarningsUnderKey(0),
      operation: (op) => af.createLeftJoin(af.createJoin([]), op),
    },
    parsedSubquery
  );
};
