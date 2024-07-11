export type { IntermediateResult } from "./types";

export { NamePlaceholder } from "./NamePlaceholder";
export { NativePlaceholder } from "./NativePlaceholder";
export { LiteralValue } from "./LiteralValue";
export { IRObject as Object } from "./IRObject";
export { IRArray as Array } from "./IRArray";

export {
  ResultError,
  IncompleteResultError,
  BadNativeValueError,
  NotANamedNodeError,
} from "./errors";
