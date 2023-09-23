import { type Parser, parseWarning, parsed } from "./common";
import * as IR from "../IntermediateResult";

export const SetObject: Parser["SetObject"] = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "Set objects are not yet supported. (https://github.com/m-ld/xql/issues/23)",
        }),
      ],
    })
  );
