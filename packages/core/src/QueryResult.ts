export type QueryResult<Query, PropertyTypes> = {
  [K in keyof Query]: Query[K] extends "?"
    ? K extends keyof PropertyTypes
      ? PropertyTypes[K]
      : unknown
    : Query[K];
};
