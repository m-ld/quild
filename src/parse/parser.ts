import { Document } from "./Document";
import { GraphObject } from "./GraphObject";
import { ListObject } from "./ListObject";
import { NodeObject } from "./NodeObject";
import { NodeObjectArray } from "./NodeObjectArray";
import { Primitive } from "./Primitive";
import { Resource } from "./Resource";
import { SetObject } from "./SetObject";
import { TopLevelGraphContainer } from "./TopLevelGraphContainer";
import { ValueObject } from "./ValueObject";

import type { Parser } from "./common";

const inherit = <T extends object, O extends Partial<T>>(
  orig: T,
  overrides: O
) =>
  Object.freeze(
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
       ---
       `Object.create()` returns `any`. */
    Object.create(orig, Object.getOwnPropertyDescriptors(overrides)) as T
  );

/**
 * Creates a parser which inherits from the default parser.
 *
 * @example
 * // Creating a new parser:
 * const myParser = makeParser({
 *   ListObject(toParse) {
 *     console.log("Parsing a list object...");
 *     return defaultParser.ListObject(toParse);
 *   },
 * });
 */
export const makeParser = (overrides: Partial<Parser>) =>
  inherit(defaultParser, overrides);

/**
 * The default {@link Parser} implementation.
 *
 * @example
 * // Using the default parser:
 * // (`defaultParser` is also the default.)
 * parseQuery(query, defaultParser)
 *
 * @example
 * // Creating a new parser:
 * const myParser = inherit(defaultParser, {
 *   ListObject(toParse) {
 *     console.log("Parsing a list object...");
 *     return defaultParser.ListObject(toParse);
 *   },
 * });
 */
export const defaultParser: Parser = Object.freeze({
  Document,
  NodeObjectArray,
  TopLevelGraphContainer,
  NodeObject,
  GraphObject,
  ListObject,
  Primitive,
  SetObject,
  ValueObject,
  Resource,
});
