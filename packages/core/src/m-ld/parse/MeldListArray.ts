import { concat } from "rambdax";

import { index, item } from "./common";
import * as IR from "../../IntermediateResult";
import { af } from "../../common";
import {
  isPlainObject,
  nestWarningsUnderKey,
  type Parser,
} from "../../parse/common";
import { evolve } from "../../upstream/rambda";
import { variableUnder } from "../../variableUnder";

export const MeldListArray: Parser["ListArray"] = async function ({
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

  const LseqSlotPredicateVariable = variableUnder(variable, "rdfLseqSlot");
  const slotVariable = variableUnder(variable, "slot");
  const indexVariable = variableUnder(slotVariable, "index");
  const itemVariable = variableUnder(slotVariable, "item");

  const parsedSubquery = await this.NodeObject({
    element: soleSubquery,
    variable: itemVariable,
    ctx,
  });

  const parsedList = evolve(
    {
      intermediateResult: (ir) => new IR.IndexedList(indexVariable, ir),
      warnings: nestWarningsUnderKey(0),
      operation: (op) =>
        af.createLeftJoin(
          af.createBgp([
            af.createPattern(variable, LseqSlotPredicateVariable, slotVariable),
            af.createPattern(slotVariable, index, indexVariable),
            af.createPattern(slotVariable, item, itemVariable),
          ]),
          op
        ),
      projections: concat([variable, indexVariable]),
      term: () => variable,
    },
    parsedSubquery
  );

  return parsedList;
};
