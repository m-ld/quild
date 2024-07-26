import { MemoryLevel } from "memory-level";
import { clone, uuid } from "@m-ld/m-ld";
import { IoRemotes } from "@m-ld/m-ld/ext/socket.io";
import {
    BehaviorSubject,
    connectable,
    distinctUntilChanged,
    filter,
    from,
    fromEvent,
    identity,
    map,
    mergeMap,
    Observable,
    pairwise,
    pipe,
    share,
    startWith,
    Subscription,
    switchAll,
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

let subscription = new Subscription();

const onLoad = async () => {
    const statusDot = document.getElementsByClassName("m-ld-status")[0];
    const domainField = document.getElementsByClassName("m-ld-domain")[0];
    const currentApp$ = new BehaviorSubject(null);
    const meld$ = connectable(
        fromEvent(domainField, "change").pipe(
            map((e) => e.target.value),
            startWith(domainField.value),
            configMap(),
            tap((config) => {
                domainField.value = config["@domain"];
            }),
            cloneMap()
        )
    );

    subscription.add(() => currentApp$.value?.dispose());
    subscription.add(
        meld$.pipe(mergeMap(identity), appMap()).subscribe(currentApp$)
    );
    subscription.add(
        meld$
            .pipe(
                switchMap((meldPromise) => {
                    return from(meldPromise).pipe(
                        switchMap((meld) => meld.status),
                        map((status) => (status.online ? "online" : "offline")),
                        startWith("connecting")
                    );
                })
            )
            .subscribe((status) => {
                statusDot.dataset.status = status;
            })
    );
    meld$.connect();
};

/**
 * Rxjs operator. Maps domains to m-ld instances. Given `""`, it creates a new
 * genesis domain. Otherwise, it clones the existing domain. Closes each
 * previous clone as it goes. TK
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
 * Rxjs operator. Maps domains to m-ld instances. Given `""`, it creates a new
 * genesis domain. Otherwise, it clones the existing domain. Closes each
 * previous clone as it goes. TK
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
 * @param {import("@m-ld/m-ld").MeldClone} storage
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
