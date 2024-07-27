import { useReducer, useState, useRef, useCallback } from "react";
import { useMeldQuery } from "@quild/react";

import { Header } from "./components/header";
import { Main } from "./components/main";
import { Footer } from "./components/footer";

import { MeldProvider } from "./hooks/useMeld";

import { todoReducer } from "./reducer";

import "./m-ld-domain-selector";
import "./app.css";

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

export function App() {
  const [todos, dispatch] = useReducer(todoReducer, []);
  const subscriptionRef = useRef(null);
  const [meld, setMeld] = useState(null);

  const subscribeToClones = useCallback(
    (domainSelector) => {
      if (domainSelector) {
        subscriptionRef.current = domainSelector.clone$.subscribe(setMeld);
      } else {
        subscriptionRef.current?.unsubscribe();
        subscriptionRef.current = null;
      }
    },
    [setMeld]
  );

  const { data: queryResults } = useMeldQuery(meld, query);

  console.log({ queryResults });

  return (
    <MeldProvider value={meld}>
      <Header dispatch={dispatch} />
      <Main todos={todos} dispatch={dispatch} />
      <Footer todos={todos} dispatch={dispatch} />
      <m-ld-domain-selector ref={subscribeToClones} />
    </MeldProvider>
  );
}
