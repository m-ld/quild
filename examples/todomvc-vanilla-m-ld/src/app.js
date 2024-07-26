import { MemoryLevel } from "memory-level";
import { clone, uuid } from "@m-ld/m-ld";
import { IoRemotes } from "@m-ld/m-ld/ext/socket.io";
import {
    BehaviorSubject,
    fromEvent,
    map,
    mergeMap,
    pairwise,
    pipe,
    startWith,
    tap,
} from "rxjs";

import View from "./view";
import Controller from "./controller";
import Model from "./model";
import Template from "./template";

import "todomvc-app-css/index.css";
import "todomvc-common/base.css";
import "./app.css";

let currentApp$;

const onLoad = async () => {
    const domainField = document.getElementById("domain");
    currentApp$ = new BehaviorSubject(null);
    const meld$ = fromEvent(domainField, "change").pipe(
        map((e) => e.target.value),
        startWith(domainField.value),
        cloneMap()
    );

    meld$.pipe(appMap()).subscribe(currentApp$);
};

/**
 * Rxjs operator. Maps domains to m-ld instances. Given `""`, it creates a new
 * genesis domain. Otherwise, it clones the existing domain. Closes each
 * previous clone as it goes.
 */
function cloneMap() {
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
        ),

        mergeMap((config) => clone(new MemoryLevel(), IoRemotes, config)),
        startWith(null),
        pairwise(),
        map(([prev, next]) => {
            prev?.close();
            return next;
        })
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
        currentApp$.value?.dispose();
        currentApp$.unsubscribe();
    });
    module.hot.accept(function (err) {});
    if (document.readyState === "complete") onLoad();
}

window.addEventListener("load", onLoad);
