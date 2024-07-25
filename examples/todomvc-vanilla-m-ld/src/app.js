import { MemoryLevel } from "memory-level";
import { clone, uuid } from "@m-ld/m-ld";
import { NullRemotes } from "@m-ld/m-ld/ext/null";

import View from "./view";
import Controller from "./controller";
import Model from "./model";
import Template from "./template";

import "todomvc-app-css/index.css";
import "todomvc-common/base.css";
import "./app.css";

/** @type { Todo } */
let todo;
const onHashChange = () => {
    todo.controller.setView(document.location.hash);
};

const createMeld = () =>
    clone(new MemoryLevel(), NullRemotes, {
        "@id": uuid(),
        "@domain": "m-ld-react.todomvc.com",
        genesis: true,
    });

const onLoad = async () => {
    const storage = await createMeld();
    todo = new Todo(storage);
    onHashChange();
};

function Todo(storage) {
    this.storage = storage;
    this.model = new Model(this.storage);
    this.template = new Template();
    this.view = new View(this.template);
    this.controller = new Controller(this.model, this.view);

    this.dispose = async () => {
        this.view.dispose();
        await this.storage.close();
    };
}

/* HOT MODULE SPECIFIC */
if (module.hot) {
    module.hot.dispose(function () {
        todo.dispose();
    });
    module.hot.accept(function (err) {});
    if (document.readyState === "complete") onLoad();
}

window.addEventListener("load", onLoad);
window.addEventListener("hashchange", onHashChange);
