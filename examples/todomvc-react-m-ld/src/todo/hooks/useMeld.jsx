import { createContext, useContext } from "react";

const MeldContext = createContext();

export const useMeld = () => {
  const meld = useContext(MeldContext);
  if (!meld)
    throw new Error(
      "No MeldClone available. useMeld must be called within a MeldProvider."
    );
  return meld;
};

// MeldProvider should never accept `undefined`.
export const MeldProvider = (props) => <MeldContext.Provider {...props} />;
