import { type Parser, parseWarning, parsed, propagateContext } from "./common";
import * as IR from "../IntermediateResult";
import { isObject } from "lodash-es";

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
      intermediateResult: new IR.NodeObject({
        ...(element["@context"] && {
          "@context": new IR.NativeValue(element["@context"]),
        }),
        "@graph": parsedNodeObjectArray.intermediateResult,
      }),
    };
  };
