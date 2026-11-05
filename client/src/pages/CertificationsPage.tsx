import { getCertifications } from "../api";
import { useQuery } from "../useQuery";

export function CertificationsPage() {
  const query = useQuery(getCertifications);

  if (query.status === "error") {
    return <p>Could not load certifications. {query.message}</p>;
  }

  if (query.status === "loading") {
    return <p>Loading...</p>;
  }

  if (query.data.length === 0) {
    return (
      <>
        <h1>Certifications</h1>
        <p>No certifications yet.</p>
      </>
    );
  }

  return (
    <>
      <h1>Certifications</h1>
      <ul>
        {query.data.map((certification) => (
          <li key={certification.slug}>{certification.title}</li>
        ))}
      </ul>
    </>
  );
}
