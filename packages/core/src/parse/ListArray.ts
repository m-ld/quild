import { concat } from "rambdax";

import { isPlainObject, nestWarningsUnderKey } from "./common";
import * as IR from "../IntermediateResult";
import { af, first, rest } from "../common";
import { evolve } from "../upstream/rambda";
import { variableUnder } from "../variableUnder";

import type { Parser } from "./common";

export const ListArray: Parser["ListArray"] = async function ({
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

  const slotVariable = variableUnder(variable, "slot");
  const itemVariable = variableUnder(slotVariable, "item");
  const restVariable = variableUnder(slotVariable, "rest");

  const parsedSubquery = await this.NodeObject({
    element: soleSubquery,
    variable: itemVariable,
    ctx,
  });

  const parsedList = evolve(
    {
      intermediateResult: (ir) =>
        new IR.LinkedList(variable, slotVariable, restVariable, ir),
      warnings: nestWarningsUnderKey(0),
      operation: (op) =>
        af.createLeftJoin(
          af.createJoin([
            af.createPath(
              variable,
              af.createZeroOrMorePath(af.createLink(rest)),
              slotVariable
            ),
            af.createBgp([
              af.createPattern(slotVariable, first, itemVariable),
              af.createPattern(slotVariable, rest, restVariable),
            ]),
          ]),
          op
        ),
      projections: concat([variable, slotVariable, restVariable]),
      term: () => variable,
    },
    parsedSubquery
  );

  return parsedList;
};
