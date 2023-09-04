import { parseWarning, parsed, type Parser } from "./common";
import * as IR from "../IntermediateResult";

export const parseGraphObject: Parser = ({ element, variable }) =>
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
