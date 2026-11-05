import { useEffect, useState } from "react";

type QueryState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

export function useQuery<T>(load: () => Promise<T>): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    load()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load data";
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  return state;
}
