export type { IntermediateResult } from "./types";

export { IRSet as Set } from "./IRSet";
export { IRObject as Object } from "./IRObject";
export { LiteralValue } from "./LiteralValue";
export { NamePlaceholder } from "./NamePlaceholder";
export { NativePlaceholder } from "./NativePlaceholder";
export { Unwrapped } from "./Unwrapped";

export {
  ResultError,
  IncompleteResultError,
  BadNativeValueError,
  NotANamedNodeError,
} from "./errors";
