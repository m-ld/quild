interface ListLink<Value> {
  /** The value, which will go into the array when linearized. */
  value: Value;
  /** The key of the next link in the list. */
  next: string | null;
}

export type LinkedListObject<Value> = Record<string, ListLink<Value>>;

/**
 * Linearizes a linked list of values as an Iterable.
 * @template Value The type of the values.
 * @param head The key of the head of the list.
 * @param links The links forming the list.
 * @throws If a link is missing in the list.
 * @returns The linearized list.
 */
export const linearizeList = function* <Value>(
  head: string,
  links: LinkedListObject<Value>
) {
  console.log("linearizeList");
  let current: string | null = head;
  while (current !== null) {
    const result: (typeof links)[string] | undefined = links[current];
    if (!result) {
      /* eslint-disable-next-line @typescript-eslint/only-throw-error
       ---
       TODO: https://github.com/m-ld/quild/issues/15 */
      throw `Missing link for ${current}`;
    }
    yield result.value;
    current = result.next;
  }
};
