import { parseWarning, parsed, type Parser } from "./common";
import * as IR from "../IntermediateResult";

export const ValueObject: Parser["ValueObject"] = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "Value objects are not yet supported. (https://github.com/m-ld/xql/issues/18)",
        }),
      ],
    })
  );
