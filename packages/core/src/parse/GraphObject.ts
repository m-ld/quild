import { type Parser, parseWarning, parsed } from "./common";
import * as IR from "../IntermediateResult";

export const GraphObject: Parser["GraphObject"] = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.LiteralValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "Graph objects are not yet supported. (https://github.com/m-ld/quild/issues/22)",
        }),
      ],
    })
  );
