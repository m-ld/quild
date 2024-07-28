import { useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useMeldQuery } from "@quild/react";

import { Item } from "./item";
import classnames from "classnames";

import { TOGGLE_ALL } from "../TodoActionTypes";
import { useDispatch } from "../hooks/useDispatch";
import { useMeld } from "../hooks/useMeld";

const query = [
  {
    "@context": {
      icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
      id: "@id",
      title: "icaltzd:summary",
    },
    id: "?",
    title: "?",
    "icaltzd:status": "?",
  },
];

export function Main() {
  const dispatch = useDispatch();
  const meld = useMeld();
  const { data: queryResults } = useMeldQuery(meld, query);

  const todos =
    queryResults?.map((result) => ({
      id: result.id,
      title: result.title,
      completed: result["icaltzd:status"] === "COMPLETED",
    })) ?? [];

  const { pathname: route } = useLocation();

  const visibleTodos = useMemo(
    () =>
      todos.filter((todo) => {
        if (route === "/active") return !todo.completed;

        if (route === "/completed") return todo.completed;

        return todo;
      }),
    [todos, route]
  );

  const toggleAll = useCallback(
    (e) =>
      dispatch({ type: TOGGLE_ALL, payload: { completed: e.target.checked } }),
    [dispatch]
  );

  return (
    <main className="main" data-testid="main">
      {visibleTodos.length > 0 ? (
        <div className="toggle-all-container">
          <input
            className="toggle-all"
            type="checkbox"
            data-testid="toggle-all"
            checked={visibleTodos.every((todo) => todo.completed)}
            onChange={toggleAll}
          />
          <label className="toggle-all-label" htmlFor="toggle-all">
            Toggle All Input
          </label>
        </div>
      ) : null}
      <ul className={classnames("todo-list")} data-testid="todo-list">
        {visibleTodos.map((todo, index) => (
          <Item todo={todo} key={todo.id} dispatch={dispatch} index={index} />
        ))}
      </ul>
    </main>
  );
}
