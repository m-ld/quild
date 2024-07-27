import { MemoryLevel } from "memory-level";
import { clone, uuid } from "@m-ld/m-ld";
import { IoRemotes } from "@m-ld/m-ld/ext/socket.io";
import {
    BehaviorSubject,
    filter,
    from,
    fromEvent,
    map,
    Observable,
    pairwise,
    pipe,
    startWith,
    switchMap,
    tap,
} from "rxjs";

import View from "./view";
import Controller from "./controller";
import Model from "./model";
import Template from "./template";

import "todomvc-app-css/index.css";
import "todomvc-common/base.css";
import "./app.css";

/**
 * @import { OperatorFunction } from 'rxjs'
 * @import { MeldConfig, MeldClone } from '@m-ld/m-ld'
 */

let subscription;

/** @returns {Observable<MeldClone>} */
function createDomainSelectorClones() {
    const statusDot = document.getElementsByClassName("m-ld-status")[0];
    const domainField = document.getElementsByClassName("m-ld-domain")[0];

    return fromEvent(domainField, "change").pipe(
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

const onLoad = async () => {
    const currentApp$ = new BehaviorSubject(null);

    subscription = createDomainSelectorClones()
        .pipe(appMap())
        .subscribe(currentApp$);
    subscription.add(() => currentApp$.value?.dispose());
};

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

/**
 * Rxjs operator. Maps m-ld instances to Todo instances. Disposes of each
 * previous Todo instance as it goes.
 * @type {OperatorFunction<MeldClone, Todo>}
 */
function appMap() {
    return pipe(
        map((meld) => new Todo(meld)),
        pairwise(),
        map(([prev, next]) => {
            prev.dispose();
            return next;
        })
    );
}

/**
 * An instance of the application
 * @param {MeldClone} storage
 */
function Todo(storage) {
    this.storage = storage;
    this.model = new Model(this.storage);
    this.template = new Template();
    this.view = new View(this.template);
    this.controller = new Controller(this.model, this.view);

    const onHashChange = () => {
        this.controller.setView(document.location.hash);
    };
    window.addEventListener("hashchange", onHashChange);
    onHashChange();

    this.dispose = async () => {
        // subscription.unsubscribe();
        this.view.dispose();
        window.removeEventListener("hashchange", onHashChange);
    };
}

/* HOT MODULE SPECIFIC */
if (module.hot) {
    module.hot.dispose(function () {
        subscription.unsubscribe();
    });
    module.hot.accept(function (err) {});
    if (document.readyState === "complete") onLoad();
}

window.addEventListener("load", onLoad);
