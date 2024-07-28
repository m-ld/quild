import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import classnames from "classnames";
import { useMeldQuery } from "@quild/react";

import { REMOVE_COMPLETED_ITEMS } from "../TodoActionTypes";
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

export function Footer() {
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

  const activeTodos = useMemo(
    () => todos.filter((todo) => !todo.completed),
    [todos]
  );

  const removeCompleted = useCallback(
    () => dispatch({ type: REMOVE_COMPLETED_ITEMS }),
    [dispatch]
  );

  // prettier-ignore
  if (todos.length === 0)
        return null;

  return (
    <footer className="footer" data-testid="footer">
      <span className="todo-count">{`${activeTodos.length} ${
        activeTodos.length === 1 ? "item" : "items"
      } left!`}</span>
      <ul className="filters" data-testid="footer-navigation">
        <li>
          <a className={classnames({ selected: route === "/" })} href="#/">
            All
          </a>
        </li>
        <li>
          <a
            className={classnames({ selected: route === "/active" })}
            href="#/active"
          >
            Active
          </a>
        </li>
        <li>
          <a
            className={classnames({ selected: route === "/completed" })}
            href="#/completed"
          >
            Completed
          </a>
        </li>
      </ul>
      <button
        className="clear-completed"
        disabled={activeTodos.length === todos.length}
        onClick={removeCompleted}
      >
        Clear completed
      </button>
    </footer>
  );
}
