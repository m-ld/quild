import { parseWarning, parsed, type Parse } from "./common";
import * as IR from "../IntermediateResult";

export const GraphObject: Parse = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "Graph objects are not yet supported. (https://github.com/m-ld/xql/issues/22)",
        }),
      ],
    })
  );
