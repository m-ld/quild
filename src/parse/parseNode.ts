import { isArray } from "lodash-es";

import {
  isPlainObject,
  queryMatches,
  type Parsed,
  type QueryInfo,
} from "./common";
import { parseNodeObject } from "./parseNodeObject";
import { parsePlural } from "./parsePlural";

export const parseNode = async (
  queryInfo: QueryInfo<unknown>
): Promise<Parsed> => {
  if (queryMatches(isArray, queryInfo)) {
    return parsePlural(queryInfo);
  } else if (queryMatches(isPlainObject, queryInfo)) {
    return parseNodeObject(queryInfo);
  } else {
    /* eslint-disable-next-line @typescript-eslint/no-throw-literal
       ---
       TODO: https://github.com/m-ld/xql/issues/15 */
    throw "TODO: Unknown type of query";
  }
};
