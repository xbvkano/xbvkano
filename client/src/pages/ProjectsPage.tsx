import { getProjects } from "../api";
import { useQuery } from "../useQuery";

export function ProjectsPage() {
  const query = useQuery(getProjects);

  if (query.status === "error") {
    return <p>Could not load projects. {query.message}</p>;
  }

  if (query.status === "loading") {
    return <p>Loading...</p>;
  }

  if (query.data.length === 0) {
    return (
      <>
        <h1>Projects</h1>
        <p>No projects yet.</p>
      </>
    );
  }

  return (
    <>
      <h1>Projects</h1>
      <ul>
        {query.data.map((project) => (
          <li key={project.slug}>{project.title}</li>
        ))}
      </ul>
    </>
  );
}
