import { parseWarning, parsed } from "./common";
import * as IR from "../IntermediateResult";

import type { Parser } from "./common";

export const ListArray: Parser["ListArray"] = ({ element, variable }) =>
  Promise.resolve(
    parsed({
      intermediateResult: new IR.LiteralValue(element),
      term: variable,
      warnings: [
        parseWarning({
          message:
            "List objects are not yet supported. (https://github.com/m-ld/quild/issues/19)",
        }),
      ],
    })
  );
