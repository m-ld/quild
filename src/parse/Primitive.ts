import { type Parser, parsed } from "./common";
import * as IR from "../IntermediateResult";
import { isPlaceholder } from "../common";
import { toRdfLiteral } from "../representation";

export const Primitive: Parser["Primitive"] = ({ element: query, variable }) =>
  Promise.resolve(
    isPlaceholder(query)
      ? parsed({
          intermediateResult: new IR.NativePlaceholder(variable),
          projections: [variable],
          term: variable,
        })
      : parsed({
          intermediateResult: new IR.LiteralValue(query),
          term: toRdfLiteral(query),
        })
  );
