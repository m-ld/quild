import { uuid, clone } from "@m-ld/m-ld";
import { IoRemotes } from "@m-ld/m-ld/ext/socket.io";
import { MemoryLevel } from "memory-level";
import {
  fromEvent,
  map,
  startWith,
  tap,
  switchMap,
  from,
  filter,
  pipe,
  pairwise,
} from "rxjs";

/**
 * @import { OperatorFunction } from 'rxjs'
 * @import { MeldConfig, MeldClone } from '@m-ld/m-ld'
 */

customElements.define(
  "m-ld-domain-selector",
  class MeldDomainSelector extends HTMLElement {
    #statusDot;
    #domainField;

    constructor() {
      super();

      const shadowRoot = this.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = /* css */ `
              :host {
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }

              .status {
                  display: inline-block;
                  vertical-align: middle;
                  border-radius: 50%;
                  width: 10px;
                  height: 10px;
                  flex: 0 0 auto;
              }

              .status[data-status="online"] {
                  background-color: #7ed321;
              }

              .status[data-status="offline"] {
                  background-color: #ffc107;
              }

              .status[data-status="connecting"] {
                  background-color: #cccccc;
              }

              .domain {
                  font-size: 20px;
                  width: 25em;
              }
            `;
      shadowRoot.appendChild(style);

      this.#statusDot = shadowRoot.appendChild(document.createElement("i"));
      this.#statusDot.className = "status";

      this.#domainField = shadowRoot.appendChild(
        document.createElement("input")
      );
      this.#domainField.className = "domain";

      this.clone$ = createDomainSelectorObservable(
        this.#domainField,
        this.#statusDot
      );
    }
  }
);

/**
 * Creates a domain selector inside the
 * @param {HTMLElement} el
 * @returns {Observable<MeldClone>}
 * */
function createDomainSelectorObservable(domainField, statusDot) {
  return fromEvent(domainField, "change").pipe(
    tap((e) => {
      console.log(e);
    }),
    // Take every value of the domain field...
    map((e) => e.target.value),
    // ...starting with the current value...
    startWith(domainField.value),
    // ...build a config for it...
    configMap(),
    // ...write the decided @domain back to the field...
    tap((config) => {
      domainField.value = config["@domain"];
    }),
    // ...and clone each domain.
    cloneMap(),

    // For each clone promise,
    switchMap((/** @type {Promise<MeldClone>} */ meldPromise) => {
      // ...once it resolves...
      return from(meldPromise).pipe(
        // ...listen to the status...
        switchMap((meld) =>
          meld.status.pipe(map((status) => ({ meld, status })))
        ),
        // ...and map the MeldStatus to a string.
        map(({ meld, status }) => ({
          meld,
          status: status.online ? "online" : "offline",
        })),
        // When the promise has arrived but not yet resolved, the status
        // is "connecting".
        startWith({ meld: null, status: "connecting" })
      );
    }),
    // Update the status dot.
    tap(({ status }) => {
      statusDot.dataset.status = status;
    }),
    // Unwrap and return only the clone.
    map(({ meld }) => meld),
    // Skip the nulls.
    filter(Boolean)
  );
}
/**
 * Rxjs operator. Maps domains to m-ld configs. Given `""`, it configures a new
 * genesis domain. Otherwise, it configures a connection to the existing domain.
 * @type {OperatorFunction<string, MeldConfig>}
 */
function configMap() {
  return pipe(
    map((domain) =>
      domain.length === 0
        ? {
            "@id": uuid(),
            "@domain": `${uuid()}.public.gw.m-ld.org`,
            genesis: true,
            io: { uri: "https://gw.m-ld.org" },
          }
        : {
            "@id": uuid(),
            "@domain": domain,
            genesis: false,
            io: { uri: "https://gw.m-ld.org" },
          }
    )
  );
}
/**
 * Rxjs operator. Maps configs to promises of m-ld instances. The promise will
 * be emitted immediately, meaning the time between receiving the promise and
 * the promise resolving will be the time when the clone is connecting. Closes
 * each previous clone as it goes.
 * @type {OperatorFunction<MeldConfig, Promise<MeldClone>>}
 */
function cloneMap() {
  return pipe(
    map((config) => clone(new MemoryLevel(), IoRemotes, config)),
    startWith(null),
    pairwise(),
    map(([prev, next]) => {
      prev?.then((m) => m.close());
      return next;
    }),
    // Just to prove to TS that we never emit a `null`.
    filter((meld) => meld !== null)
  );
}
