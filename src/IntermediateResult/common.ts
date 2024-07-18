// In the style of Clojure's `update`
// https://clojuredocs.org/clojure.core/update
export const update = <K extends keyof O, O extends object>(
  obj: O,
  key: K,
  replaceFn: (previousValue: O[K] | undefined) => O[K]
): O => ({ ...obj, [key]: replaceFn(obj[key]) });
