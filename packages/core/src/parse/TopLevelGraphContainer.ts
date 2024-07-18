import { type Parser, propagateContext } from "./common";
import * as IR from "../IntermediateResult";

export const TopLevelGraphContainer: Parser["TopLevelGraphContainer"] =
  async function ({ element, variable, ctx }) {
    const graph = element["@graph"];

    const parsedNodeObjectArray = await this.NodeObjectArray({
      element: graph,
      variable,
      ctx: await propagateContext(element["@context"], ctx),
    });

    return {
      ...parsedNodeObjectArray,
      intermediateResult: new IR.Object({
        ...(element["@context"] && {
          "@context": new IR.LiteralValue(element["@context"]),
        }),
        "@graph": parsedNodeObjectArray.intermediateResult,
      }),
    };
  };
