import { Navigate, Outlet } from "react-router-dom";
import { getSession } from "../api";
import { useQuery } from "../useQuery";

export function RequireAuth() {
  const query = useQuery(getSession);

  if (query.status === "loading") {
    return <p>Loading...</p>;
  }

  if (query.status === "error") {
    return <p>Could not check login. {query.message}</p>;
  }

  if (!query.data.authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
