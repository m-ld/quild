/* eslint-disable @typescript-eslint/no-throw-literal */

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
    throw "TODO: Unknown type of query";
  }
};
