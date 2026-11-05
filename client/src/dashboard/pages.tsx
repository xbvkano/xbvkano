import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getTokenStatus } from "../api";
import { useQuery } from "../useQuery";
import {
  ApplicationEditor,
  EntryEditor,
  ProfileEditor,
  RecordTable,
  ReferenceEditor,
  SkillEditor,
  entryKinds,
  entrySecondary,
} from "./PortfolioAdmin";
import { usePortfolio } from "./PortfolioData";
import { Modal } from "./Modal";
import {
  deleteApplication,
  deleteEntry,
  deleteReference,
  deleteSkill,
  type EntryKind,
  type JobApplication,
  type ManagedEntry,
  type Reference,
  type Skill,
} from "./api";

function PageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

function useDelete(kind: "entry" | "skill" | "reference" | "application") {
  const { reload } = usePortfolio();
  const [pending, setPending] = useState<{ id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ask(id: number, name: string) {
    setError(null);
    setPending({ id, name });
  }

  function close() {
    if (!busy) {
      setPending(null);
      setError(null);
    }
  }

  async function confirm() {
    if (!pending) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (kind === "entry") {
        await deleteEntry(pending.id);
      } else if (kind === "skill") {
        await deleteSkill(pending.id);
      } else if (kind === "reference") {
        await deleteReference(pending.id);
      } else {
        await deleteApplication(pending.id);
      }
      await reload();
      setPending(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  const dialog = pending ? (
    <Modal title="Delete">
      <p>Delete {pending.name}? This cannot be undone.</p>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="row-actions">
        <button className="button" type="button" onClick={() => void confirm()} disabled={busy}>
          Delete
        </button>
        <button className="button" type="button" onClick={close} disabled={busy}>
          Cancel
        </button>
      </div>
    </Modal>
  ) : null;

  return { ask, dialog };
}

const entryPaths: Record<EntryKind, string> = {
  project: "/dashboard/projects",
  certificate: "/dashboard/certifications",
  experience: "/dashboard/experience",
  education: "/dashboard/education",
  coursework: "/dashboard/coursework",
};

const entryDescriptions: Record<EntryKind, string> = {
  project: "Projects you want to share.",
  certificate: "Certificates and credentials.",
  experience: "Roles and internships. Leave the end date empty if the role is current.",
  education: "Schools and degrees.",
  coursework: "Courses, abbreviations, and dates.",
};

export function DashboardHome() {
  const { portfolio, applications } = usePortfolio();
  const token = useQuery(getTokenStatus);
  const profile = portfolio.profile;
  const cards: { to: string; label: string; count: number }[] = [
    { to: "/dashboard/profile", label: "Profile", count: 1 },
    ...entryKinds.map((section) => ({
      to: entryPaths[section.kind],
      label: section.heading,
      count: portfolio.entries[section.kind].length,
    })),
    { to: "/dashboard/skills", label: "Skills", count: portfolio.skills.length },
    { to: "/dashboard/references", label: "References", count: portfolio.references.length },
    { to: "/dashboard/applications", label: "Applications", count: applications.length },
  ];

  let tokenText = "Checking the API token...";
  if (token.status === "error") {
    tokenText = "Could not check the API token.";
  } else if (token.status === "ready" && token.data.active) {
    tokenText = `A token is active until ${new Date(token.data.expiresAt).toLocaleString()}.`;
  } else if (token.status === "ready" && !token.data.active && token.data.status) {
    tokenText = token.data.status;
  } else if (token.status === "ready") {
    tokenText = "No token yet.";
  }

  return (
    <div className="dashboard-panel">
      <h1>{profile.name}</h1>
      <p className="page-description">{[profile.phone, profile.email].filter(Boolean).join(" · ")}</p>
      <div className="home-grid">
        {cards.map((card) => (
          <Link className="home-card" key={card.to} to={card.to}>
            <strong>{card.count}</strong>
            <span>{card.label}</span>
          </Link>
        ))}
      </div>
      <p className="token-summary">
        {tokenText} <Link to="/dashboard/token">API token</Link>
      </p>
    </div>
  );
}

export function ProfilePage() {
  const { portfolio, reload } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const profile = portfolio.profile;

  return (
    <div className="dashboard-panel">
      <PageIntro
        title="Profile"
        description="Personal details used by the portfolio and the outside assistant."
        action={
          <button className="button" type="button" onClick={() => setEditing(true)}>
            Edit
          </button>
        }
      />
      <p>
        {profile.name}
        {profile.age !== null ? ` · ${profile.age}` : ""}
      </p>
      <p>{[profile.phone, profile.email].filter(Boolean).join(" · ")}</p>
      <p>{profile.languages.join(", ")}</p>
      {profile.birthDate ? <p>Born {profile.birthDate}</p> : null}
      {profile.notes ? <p className="notes">{profile.notes}</p> : null}
      {editing ? (
        <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSaved={async () => {
          await reload();
          setEditing(false);
        }} />
      ) : null}
    </div>
  );
}

export function EntryPage({ kind }: { kind: EntryKind }) {
  const { portfolio, reload } = usePortfolio();
  const section = entryKinds.find((item) => item.kind === kind);
  const [editor, setEditor] = useState<ManagedEntry | null | undefined>(undefined);
  const removal = useDelete("entry");
  if (!section) {
    return null;
  }
  const entries = portfolio.entries[kind];

  return (
    <div className="dashboard-panel">
      <PageIntro
        title={section.heading}
        description={entryDescriptions[kind]}
        action={
          <button className="button button-primary" type="button" onClick={() => setEditor(null)}>
            Add
          </button>
        }
      />
      <RecordTable
        rows={entries.map((entry) => ({
          id: entry.id,
          primary: entry.title,
          secondary: entrySecondary(entry),
        }))}
        onEdit={(id) => {
          const entry = entries.find((item) => item.id === id);
          if (entry) {
            setEditor(entry);
          }
        }}
        onDelete={(id) => {
          const entry = entries.find((item) => item.id === id);
          if (entry) {
            removal.ask(entry.id, entry.title);
          }
        }}
      />
      {editor !== undefined ? (
        <EntryEditor
          kind={kind}
          entry={editor}
          skills={portfolio.skills}
          labels={section}
          onClose={() => setEditor(undefined)}
          onSaved={async () => {
            await reload();
            setEditor(undefined);
          }}
        />
      ) : null}
      {removal.dialog}
    </div>
  );
}

export function SkillsPage() {
  const { portfolio, reload } = usePortfolio();
  const [editor, setEditor] = useState<Skill | null | undefined>(undefined);
  const removal = useDelete("skill");

  return (
    <div className="dashboard-panel">
      <PageIntro
        title="Skills"
        description="Skills that can be attached to a project, certificate, role, school, or course."
        action={
          <button className="button button-primary" type="button" onClick={() => setEditor(null)}>
            Add
          </button>
        }
      />
      <RecordTable
        rows={portfolio.skills.map((skill) => ({
          id: skill.id,
          primary: skill.name,
          secondary: skill.shortDescription,
        }))}
        onEdit={(id) => {
          const skill = portfolio.skills.find((item) => item.id === id);
          if (skill) {
            setEditor(skill);
          }
        }}
        onDelete={(id) => {
          const skill = portfolio.skills.find((item) => item.id === id);
          if (skill) {
            removal.ask(skill.id, skill.name);
          }
        }}
      />
      {editor !== undefined ? (
        <SkillEditor
          skill={editor}
          onClose={() => setEditor(undefined)}
          onSaved={async () => {
            await reload();
            setEditor(undefined);
          }}
        />
      ) : null}
      {removal.dialog}
    </div>
  );
}

export function ReferencesPage() {
  const { portfolio, reload } = usePortfolio();
  const [editor, setEditor] = useState<Reference | null | undefined>(undefined);
  const removal = useDelete("reference");

  return (
    <div className="dashboard-panel">
      <PageIntro
        title="References"
        description="People who can speak to your work."
        action={
          <button className="button button-primary" type="button" onClick={() => setEditor(null)}>
            Add
          </button>
        }
      />
      <RecordTable
        rows={portfolio.references.map((reference) => ({
          id: reference.id,
          primary: `${reference.firstName} ${reference.lastName}`,
          secondary: reference.email,
        }))}
        onEdit={(id) => {
          const reference = portfolio.references.find((item) => item.id === id);
          if (reference) {
            setEditor(reference);
          }
        }}
        onDelete={(id) => {
          const reference = portfolio.references.find((item) => item.id === id);
          if (reference) {
            removal.ask(reference.id, `${reference.firstName} ${reference.lastName}`);
          }
        }}
      />
      {editor !== undefined ? (
        <ReferenceEditor
          reference={editor}
          onClose={() => setEditor(undefined)}
          onSaved={async () => {
            await reload();
            setEditor(undefined);
          }}
        />
      ) : null}
      {removal.dialog}
    </div>
  );
}

export function ApplicationsPage() {
  const { applications, reload } = usePortfolio();
  const [editor, setEditor] = useState<JobApplication | null | undefined>(undefined);
  const removal = useDelete("application");

  return (
    <div className="dashboard-panel">
      <PageIntro
        title="Job applications"
        description="Companies you have applied to, and where each one stands."
        action={
          <button className="button button-primary" type="button" onClick={() => setEditor(null)}>
            Add
          </button>
        }
      />
      <RecordTable
        rows={applications.map((application) => ({
          id: application.id,
          primary: application.companyName,
          secondary: `${application.appliedOn} · ${application.status}`,
        }))}
        onEdit={(id) => {
          const application = applications.find((item) => item.id === id);
          if (application) {
            setEditor(application);
          }
        }}
        onDelete={(id) => {
          const application = applications.find((item) => item.id === id);
          if (application) {
            removal.ask(application.id, application.companyName);
          }
        }}
      />
      {editor !== undefined ? (
        <ApplicationEditor
          application={editor}
          onClose={() => setEditor(undefined)}
          onSaved={async () => {
            await reload();
            setEditor(undefined);
          }}
        />
      ) : null}
      {removal.dialog}
    </div>
  );
}
