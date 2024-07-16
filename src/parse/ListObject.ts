import { nestWarningsUnderKey, type Parser } from "./common";
import * as IR from "../IntermediateResult";
import { af } from "../common";
import { evolve } from "../upstream/rambda";

export const ListObject: Parser["ListObject"] = async function ({
  element,
  variable,
  ctx,
}) {
  const parsedList = await this.ListArray({
    element: element["@list"],
    variable,
    ctx,
  });

  const parsedListObject = evolve(
    {
      intermediateResult: (ir) => new IR.Object({ "@list": ir }),
      // The list contents are an array, and therefore optional in the result,
      // so `op` will be a left join. The list itself is mandatory, so we wrap
      // the left join in a join. This signals to the parent that the
      // relationship between the parent and the list should not be optional.
      operation: (op) => af.createJoin([op]),
      warnings: nestWarningsUnderKey("@list"),
    },
    parsedList
  );

  return parsedListObject;
};
