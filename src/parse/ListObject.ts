import { nestWarningsUnderKey, type Parser } from "./common";
import * as IR from "../IntermediateResult";
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
      warnings: nestWarningsUnderKey("@list"),
    },
    parsedList
  );

  return parsedListObject;
};
