import { useReducer, useState, useRef, useCallback, useEffect } from "react";
import { useMeldQuery } from "@quild/react";

import { Header } from "./components/header";
import { Main } from "./components/main";
import { Footer } from "./components/footer";

import { DispatchProvider } from "./hooks/useDispatch";
import { MeldProvider } from "./hooks/useMeld";

// import "../m-ld-domain-selector";
import "./app.css";
import { dispatcher } from "./dispatcher";

export function App() {
  return (
    <WithDispatch>
      <Header />
      <Main />
      <Footer />
    </WithDispatch>
  );
  // }
}

function WithDispatch({ children }) {
  const [meld, setMeld] = useState(null);

  useEffect(() => {
    const subscription = document
      .getElementById("domain-selector")
      .clone$.subscribe(setMeld);
    return () => subscription.unsubscribe();
  });

  return (
    meld && (
      <MeldProvider value={meld}>
        <DispatchProvider value={dispatcher(meld)}>{children}</DispatchProvider>
      </MeldProvider>
    )
  );
}
