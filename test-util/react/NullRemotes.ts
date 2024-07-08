import { NEVER, type Observable, concat, of } from "rxjs";

import type {
  MeldLocal,
  MeldRemotes,
  OperationMessage,
} from "@m-ld/m-ld/ext/engine";
import type { LiveValue } from "@m-ld/m-ld/ext/engine/api-support";

class NotImplementedError extends Error {
  constructor(methodName: string) {
    super(
      `${methodName} is not implemented for a NullRemote. The local clone should be genesis.`
    );
  }
}

const constantLiveValue = <T>(value: T): LiveValue<T> => {
  // Emit `value`, then never complete.
  const observable = concat(of(value), NEVER);
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ---
    TS doesn't know about Object.defineProperty(). */
  return Object.defineProperty(observable, "value", {
    value,
    writable: false,
  }) as unknown as LiveValue<T>;
};

export class NullRemotes implements MeldRemotes {
  readonly operations: Observable<OperationMessage> = NEVER;
  readonly updates: Observable<OperationMessage> = NEVER;
  readonly live: LiveValue<boolean | null> = constantLiveValue(false);

  /* eslint-disable-next-line @typescript-eslint/no-empty-function
    ---
    We don't need a local. */
  setLocal(_clone: MeldLocal | null): void {}

  newClock(): never {
    throw new NotImplementedError("newClock");
  }

  revupFrom(): never {
    throw new NotImplementedError("revupFrom");
  }

  snapshot(): never {
    throw new NotImplementedError("snapshot");
  }
}
