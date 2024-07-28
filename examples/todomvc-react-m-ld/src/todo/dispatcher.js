import * as TodoActionType from "./TodoActionTypes";

/** Returns a "dispatch" function which performs an action. */
export const dispatcher = (meld) => (action) => {
  switch (action.type) {
    case TodoActionType.ADD_ITEM:
      return meld.write({
        "@insert": {
          "@type": "http://www.w3.org/2002/12/cal/icaltzd#Vtodo",
          "http://www.w3.org/2002/12/cal/icaltzd#summary": action.payload.title,
          "http://www.w3.org/2002/12/cal/icaltzd#status": "IN-PROCESS",
        },
      });

    case TodoActionType.UPDATE_ITEM:
      return meld.write({
        "@update": {
          "@id": action.payload.id,
          "http://www.w3.org/2002/12/cal/icaltzd#summary": action.payload.title,
        },
      });

    case TodoActionType.REMOVE_ITEM:
      return meld.write({
        "@delete": {
          "@id": action.payload.id,
        },
      });

    case TodoActionType.TOGGLE_ITEM:
      console.log({ action });
      return meld.write({
        "@update": {
          "@id": action.payload.id,
          "http://www.w3.org/2002/12/cal/icaltzd#status": action.payload
            .completed
            ? "COMPLETED"
            : "IN-PROCESS",
        },
      });

    case TodoActionType.REMOVE_ALL_ITEMS:
      return meld.write({
        "@where": {
          "@id": "?id",
          "@type": "http://www.w3.org/2002/12/cal/icaltzd#Vtodo",
          "?p": "?o",
        },
        "@delete": {
          "@id": "?id",
          "?p": "?o",
        },
      });

    case TodoActionType.TOGGLE_ALL:
      return meld.write({
        "@update": {
          "@id": "?",
          "http://www.w3.org/2002/12/cal/icaltzd#status": "COMPLETED",
        },
      });

    case TodoActionType.REMOVE_COMPLETED_ITEMS:
      return meld.write({
        "@where": {
          "@id": "?id",
          "@type": "http://www.w3.org/2002/12/cal/icaltzd#Vtodo",
          "http://www.w3.org/2002/12/cal/icaltzd#status": "COMPLETED",
          "?p": "?o",
        },
        "@delete": {
          "@id": "?id",
          "?p": "?o",
        },
      });
  }

  throw Error(`Unknown action: ${action.type}`);
};
