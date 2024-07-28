import { observeMeldQuery } from "@quild/observable";
import { map, Observable } from "rxjs";

/**
 * @typedef {Object} Todo
 * @property {string} id The ID of the todo
 * @property {string} title The title of the todo
 * @property {boolean} completed True if the todo is completed
 */

/**
 * @typedef {Object} RDFTodo
 * @property {string} id The ID of the todo
 * @property {string} title The title of the todo
 * @property {string} status The status of the todo
 */

const context = {
    "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
    id: "@id",
    title: "summary",
};

const todoQuery = {
    "@context": context,
    "@type": "Vtodo",
    id: "?",
    title: "?",
    status: "?",
};

/**
 * @template {Partial<RDFTodo>} T
 * @param {T} rdfTodo
 * @returns {Omit<T, "status"> & { completed: boolean; }}
 */
const fromRdfTodo = ({ status, ...data }) => ({
    ...data,
    completed: status === "COMPLETED",
});

/**
 * @template {Partial<Todo>} T
 * @param {T} todo
 * @returns {Omit<T, "completed"> & { status?: string; }}
 */
const toRdfTodo = ({ completed, ...data }) => ({
    "@context": context,
    "@type": "Vtodo",
    ...data,
    ...(typeof completed === "undefined"
        ? {}
        : { status: completed ? "COMPLETED" : "IN-PROCESS" }),
});

/**
 * @param {Todo[]} data The todos
 * @returns {{ active: number, completed: number, total: number }} The stats
 */
const countTodos = (data) => {
    const stats = {
        active: 0,
        completed: 0,
        total: 0,
    };
    for (let todo of data) {
        if (todo.completed) stats.completed++;
        else stats.active++;

        stats.total++;
    }
    return stats;
};

class Model {
    /**
     * Creates a new Model instance and hooks up the storage.
     * @param {import("@m-ld/m-ld").MeldClone} storage The m-ld clone
     */
    constructor(storage) {
        this.storage = storage;
    }

    /**
     * Creates a new todo model
     *
     * @param {string} [title] The title of the task
     * @param {function} [callback] The callback to fire after the model is created
     */
    create(title, callback) {
        title = title || "";

        this.storage
            .write({
                "@insert": {
                    "@type": "http://www.w3.org/2002/12/cal/icaltzd#Vtodo",
                    "http://www.w3.org/2002/12/cal/icaltzd#summary":
                        title.trim(),
                    "http://www.w3.org/2002/12/cal/icaltzd#status":
                        "IN-PROCESS",
                },
            })
            .then(() => callback());
    }

    /**
     * Returns an observable of results from a query.
     *
     * @param {Partial<Todo>} [query] A query to match models against
     * @returns {Observable<Todo[]>} The observable of results
     */
    observeQuery(query) {
        return observeMeldQuery(this.storage, [
            { ...todoQuery, ...toRdfTodo(query) },
        ]).pipe(
            map(
                (
                    /** @type {import("@quild/core").ReadQueryResult<RDFTodo[]>} */ {
                        data,
                    }
                ) => data.map(fromRdfTodo)
            )
        );
    }

    /**
     * Returns an observable of the latest stats.
     * @returns {Observable<{ active: number, completed: number, total: number }>} The observable of stats
     */
    observeCounts() {
        return this.observeQuery({}).pipe(map((todos) => countTodos(todos)));
    }

    /**
     * Updates a model by giving it an ID, data to update, and a callback to fire when
     * the update is complete.
     *
     * @param {string} id The id of the model to update
     * @param {object} data The properties to update and their new value
     * @param {function} callback The callback to fire when the update is complete.
     */
    update(id, data, callback) {
        this.storage
            .write({
                "@context": context,
                "@update": {
                    "@id": id,
                    ...toRdfTodo(data),
                },
            })
            .then(() => callback());
    }

    /**
     * Removes models from storage
     *
     * @param {string|Partial<Todo>} query The ID of the model to remove, or a
     *                                     query matching the models to remove.
     * @param {function} callback The callback to fire when the removal is complete.
     */
    remove(query, callback) {
        const request =
            typeof query === "string"
                ? {
                      "@delete": {
                          "@id": query,
                      },
                  }
                : {
                      // Add the `@context` here because `m-ld` currently won't
                      // notice it any deeper.
                      "@context": context,
                      "@delete": {
                          "@id": "?id",
                          "?p": "?o",
                      },
                      "@where": {
                          "@id": "?id",
                          "?p": "?o",
                          ...toRdfTodo(query),
                      },
                  };

        this.storage.write(request).then(() => callback());
    }

    /**
     * WARNING: Will remove ALL data from storage.
     *
     * @param {function} callback The callback to fire when the storage is wiped.
     */
    removeAll(callback) {
        this.remove({}, callback);
    }
}

export default Model;
