import { createContext, useContext } from "react";

const DispatchContext = createContext();

export const useDispatch = () => {
  const dispatch = useContext(DispatchContext);
  if (!dispatch)
    throw new Error(
      "No dispatcher available. useDispatcher must be called within a DispatcherProvider."
    );
  return dispatch;
};

export const DispatchProvider = DispatchContext.Provider;
