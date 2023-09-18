import { parseWarning, parsed, type Parse } from "./common";
import * as IR from "../IntermediateResult";

export const TopLevelGraphContainer: Parse = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.NativeValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "Top-level @graph containers are not yet supported. (https://github.com/m-ld/xql/issues/21)",
        }),
      ],
    })
  );
