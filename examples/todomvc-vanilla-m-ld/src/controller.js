import { Subject, BehaviorSubject, switchMap } from "rxjs";

class Controller {
    /**
     * Take a model & view, then act as controller between them
     * @param  {object} model The model instance
     * @param  {object} view  The view instance
     */
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.view.bindCallback("newTodo", (title) => this.addItem(title));
        this.view.bindCallback("itemEdit", (item) => this.editItem(item.id));
        this.view.bindCallback("itemEditDone", (item) =>
            this.editItemSave(item.id, item.title)
        );
        this.view.bindCallback("itemEditCancel", (item) =>
            this.editItemCancel(item.id)
        );
        this.view.bindCallback("itemRemove", (item) =>
            this.removeItem(item.id)
        );
        this.view.bindCallback("itemToggle", (item) =>
            this.toggleComplete(item.id, item.completed)
        );
        this.view.bindCallback("removeCompleted", () =>
            this.removeCompletedItems()
        );
        this.view.bindCallback("toggleAll", (status) =>
            this.toggleAll(status.completed)
        );

        this.currentQuery$ = new Subject();
        this.currentData$ = new BehaviorSubject([]);
        this.currentQuery$
            .pipe(switchMap((query) => model.observeQuery(query)))
            .subscribe(this.currentData$);

        this.currentData$.subscribe((data) => {
            return this.view.render("showEntries", data);
        });

        model.observeCounts().subscribe((data) => this._updateCounts(data));
    }

    /**
     * Load & Initialize the view
     * @param {string} hash
     */
    setView(hash) {
        const route = hash.split("/")[1];
        const page = route || "";
        this._updateFilter(page);
    }

    /**
     * An event to fire whenever you want to add an item. Simply pass in the event
     * object and it'll handle the DOM insertion and saving of the new item.
     */
    addItem(title) {
        if (title.trim() === "") return;

        this.model.create(title, () => {
            this.view.render("clearNewTodo");
        });
    }

    /*
     * Triggers the item editing mode.
     */
    editItem(id) {
        const item = this.currentData$.value.find((item) => item.id === id);
        this.view.render("editItem", item);
    }

    /*
     * Finishes the item editing mode successfully.
     */
    editItemSave(id, title) {
        title = title.trim();

        if (title.length !== 0) {
            this.model.update(id, { title }, () => {
                this.view.render("editItemDone", { id, title });
            });
        } else {
            this.removeItem(id);
        }
    }

    /*
     * Cancels the item editing mode.
     */
    editItemCancel(id) {
        const item = this.currentData$.value.find((item) => item.id === id);
        this.view.render("editItemDone", item);
    }

    /**
     * Find the DOM element with given ID,
     * Then remove it from DOM & Storage
     */
    removeItem(id) {
        this.model.remove(id, () => this.view.render("removeItem", id));
    }

    /**
     * Will remove all completed items from the DOM and storage.
     */
    removeCompletedItems() {
        this.model.remove({ completed: true }, () => {});
    }

    /**
     * Give it an ID of a model and a checkbox and it will update the item
     * in storage based on the checkbox's state.
     *
     * @param {number} id The ID of the element to complete or uncomplete
     * @param {object} checkbox The checkbox to check the state of complete
     *                          or not
     */
    toggleComplete(id, completed) {
        this.model.update(id, { completed }, () => {
            this.view.render("elementComplete", { id, completed });
        });
    }

    /**
     * Will toggle ALL checkboxes' on/off state and completeness of models.
     * Just pass in the event object.
     */
    toggleAll(completed) {
        const allItems = this.currentData$.value;
        allItems.forEach((item) => {
            this.toggleComplete(item.id, completed);
        });
    }

    /**
     * Updates the pieces of the page which change depending on the remaining
     * number of todos.
     * @param {{ active: number, completed: number, total: number }} counts
     */
    _updateCounts(counts) {
        const completed = counts.completed;
        const visible = completed > 0;
        const checked = completed === counts.total;

        this.view.render("updateElementCount", counts.active);
        this.view.render("clearCompletedButton", { completed, visible });
        this.view.render("toggleAll", { checked });
        this.view.render("contentBlockVisibility", {
            visible: counts.total > 0,
        });
    }

    /**
     * Simply updates the filter nav's selected states
     * @param {string} currentPage
     */
    _updateFilter(currentPage) {
        switch (currentPage) {
            case "active":
                this.currentQuery$.next({ completed: false });
                break;
            case "completed":
                this.currentQuery$.next({ completed: true });
                break;
            default:
                this.currentQuery$.next({});
                break;
        }

        this.view.render("setFilter", currentPage);
    }
}

export default Controller;
