import { createContext, useContext } from "react";

export type OmnisearchOpenOptions = {
  query?: string;
};

export type OmnisearchContextValue = {
  isOpen: boolean;
  open: (options?: OmnisearchOpenOptions) => void;
  close: () => void;
};

export const OmnisearchContext = createContext<OmnisearchContextValue | null>(null);

export function useOmnisearch(): OmnisearchContextValue {
  const context = useContext(OmnisearchContext);
  if (!context) {
    throw new Error("useOmnisearch must be used within <OmnisearchProvider>");
  }

  return context;
}
