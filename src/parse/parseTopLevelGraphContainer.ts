import { parseWarning, type Parsed, type ToParse, parsed } from "./common";
import * as IR from "../IntermediateResult";

export const parseTopLevelGraphContainer = ({
  element,
  variable,
}: ToParse): Promise<Parsed> =>
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
