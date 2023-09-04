import { nestWarningsUnderKey, isPlainObject, type Parser } from "./common";
import { parseNodeObject } from "./parseNodeObject";
import * as IR from "../IntermediateResult";
import { evolve, prepend } from "../upstream/rambda";

import type * as RDF from "@rdfjs/types";
import type { JsonArray } from "type-fest";

export const parseNodeObjectArray: Parser<JsonArray, IR.Plural> = async ({
  element: query,
  variable,
  ctx,
}) => {
  const soleSubquery = query[0];
  if (!(soleSubquery && query.length === 1)) {
    /* eslint-disable-next-line @typescript-eslint/no-throw-literal
       ---
       TODO: https://github.com/m-ld/xql/issues/15 */
    throw "TODO: Only exactly one subquery is supported in an array, so far.";
  }

  if (!isPlainObject(soleSubquery))
    /* eslint-disable-next-line @typescript-eslint/no-throw-literal
       ---
       TODO: https://github.com/m-ld/xql/issues/15 */
    throw "TODO: Only objects can be in plural nodes, so far.";

  return evolve(
    {
      intermediateResult: (ir) => new IR.Plural(variable, ir),
      projections: prepend(variable)<RDF.Variable>,
      warnings: nestWarningsUnderKey(0),
    },
    await parseNodeObject({
      element: soleSubquery,
      variable,
      ctx,
    })
  );
};
