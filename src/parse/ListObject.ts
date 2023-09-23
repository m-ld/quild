import { parseWarning, parsed } from "./common";
import * as IR from "../IntermediateResult";

import type { Parser } from "./common";

export const ListObject: Parser["ListObject"] = ({ element, variable }) =>
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
