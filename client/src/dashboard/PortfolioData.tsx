import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getApplications, getPortfolio, type JobApplication, type PortfolioDocument } from "./api";

type PortfolioState = {
  portfolio: PortfolioDocument;
  applications: JobApplication[];
  reload: () => Promise<void>;
};

const PortfolioContext = createContext<PortfolioState | null>(null);

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Could not load portfolio";
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioDocument | null>(null);
  const [applications, setApplications] = useState<JobApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [nextPortfolio, nextApplications] = await Promise.all([getPortfolio(), getApplications()]);
    setPortfolio(nextPortfolio);
    setApplications(nextApplications);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload().catch((caught: unknown) => {
      if (!cancelled) {
        setError(message(caught));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (error && !portfolio) {
    return <p>Could not load portfolio. {error}</p>;
  }
  if (!portfolio || !applications) {
    return <p>Loading portfolio...</p>;
  }

  return (
    <PortfolioContext.Provider value={{ portfolio, applications, reload }}>{children}</PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioState {
  const value = useContext(PortfolioContext);
  if (!value) {
    throw new Error("Dashboard pages must render inside the dashboard");
  }
  return value;
}
