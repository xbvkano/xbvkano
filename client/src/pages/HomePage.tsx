import { getProfile } from "../api";
import { useQuery } from "../useQuery";

export function HomePage() {
  const query = useQuery(getProfile);

  if (query.status === "error") {
    return <p>Could not load profile. {query.message}</p>;
  }

  if (query.status === "loading") {
    return <p>Loading...</p>;
  }

  return <h1>{query.data.name}</h1>;
}
