import { BehaviorSubject, map, pairwise, pipe } from "rxjs";

import View from "./view";
import Controller from "./controller";
import Model from "./model";
import Template from "./template";

import "todomvc-app-css/index.css";
import "todomvc-common/base.css";
import "./app.css";
import "./m-ld-domain-selector";

/**
 * @import { OperatorFunction } from 'rxjs'
 * @import { MeldClone } from '@m-ld/m-ld'
 */

let subscription;

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

const onLoad = async () => {
    const currentApp$ = new BehaviorSubject(null);

    subscription = document
        .getElementById("domain-selector")
        .clone$.pipe(appMap())
        .subscribe(currentApp$);
    subscription.add(() => currentApp$.value?.dispose());
};

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
