import { MeldConfig } from "@m-ld/m-ld";
import {
  MeldLocal,
  MeldRemotes,
  OperationMessage,
} from "@m-ld/m-ld/ext/engine";
import { LiveValue } from "@m-ld/m-ld/ext/engine/api-support";
import { NEVER, Observable, concat, of } from "rxjs";

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
  return Object.defineProperty(observable, "value", {
    value,
    writable: false,
  }) as unknown as LiveValue<T>;
};

export class NullRemotes implements MeldRemotes {
  constructor(config: MeldConfig) {}

  readonly operations: Observable<OperationMessage> = NEVER;
  readonly updates: Observable<OperationMessage> = NEVER;
  readonly live: LiveValue<boolean | null> = constantLiveValue(false);

  setLocal(clone: MeldLocal | null): void {}

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
