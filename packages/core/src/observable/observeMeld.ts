import { Observable } from "rxjs";

import type { MeldClone, MeldReadState, MeldUpdate } from "@m-ld/m-ld";

/**
 * Create an Observable of the states of a m-ld clone, emitting the current
 * state after each update. Emitted values are pairs of an update and the
 * resulting state. The first value emitted will be the initial state, with a
 * `null` update.
 *
 * @param meld The m-ld clone to observe.
 * @returns An observable of the clone's updates and states.
 */
export const observeMeld = (meld: MeldClone) =>
  new Observable<[MeldUpdate | null, MeldReadState]>((subscriber) => {
    const subscription = meld.read(
      (state: MeldReadState) => {
        subscriber.next([null, state]);
      },
      (update, state) => {
        ((state: MeldReadState) => {
          subscriber.next([update, state]);
        })(state);
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  });
