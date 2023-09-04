import { parseWarning, parsed, type Parser } from "./common";
import * as IR from "../IntermediateResult";

export const parseListObject: Parser = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "List objects are not yet supported. (https://github.com/m-ld/xql/issues/19)",
        }),
      ],
    })
  );
