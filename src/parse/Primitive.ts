import { parsed, type Parse } from "./common";
import * as IR from "../IntermediateResult";
import { PLACEHOLDER } from "../common";
import { toRdfLiteral } from "../representation";

const isPlaceholder = (v: unknown): v is typeof PLACEHOLDER =>
  v === PLACEHOLDER;

export const Primitive: Parse<
  string | number | boolean,
  IR.NativePlaceholder | IR.NativeValue
> = ({ element: query, variable }) =>
  Promise.resolve(
    isPlaceholder(query)
      ? parsed({
          intermediateResult: new IR.NativePlaceholder(variable),
          projections: [variable],
          term: variable,
        })
      : parsed({
          intermediateResult: new IR.NativeValue(query),
          term: toRdfLiteral(query),
        })
  );
