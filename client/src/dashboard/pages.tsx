import { useEffect, useId, useState, type ReactNode } from "react";
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
  moveEntry,
  openApplicationDocument,
  type ApplicationStatus,
  type InterviewStage,
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
  coursework: "Transcript courses, with the most relevant software engineering coursework first.",
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
      count:
        section.kind === "coursework"
          ? portfolio.coursework.length + portfolio.entries.coursework.length
          : portfolio.entries[section.kind].length,
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
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const removal = useDelete("entry");
  if (!section) {
    return null;
  }
  const entries = portfolio.entries[kind];
  const catalog = kind === "coursework" ? portfolio.coursework : [];

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
      {catalog.length > 0 ? (
        <ol className="course-list">
          {catalog.map((course) => (
            <li key={course.slug}>
              <h2>
                <span className="course-code">{course.shortName}</span> {course.fullName}
              </h2>
              <p className="course-meta">
                {course.term} · {course.school}
              </p>
              <p>{course.description}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {kind === "coursework" && entries.length === 0 ? null : (
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
          moving={moving}
          onMove={(id, direction) => {
            setMoving(true);
            setMoveError("");
            void moveEntry(id, direction)
              .then(() => reload())
              .catch((error: unknown) => {
                setMoveError(error instanceof Error ? error.message : "Could not reorder");
              })
              .finally(() => setMoving(false));
          }}
        />
      )}
      {moveError ? <p className="form-error">{moveError}</p> : null}
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

function errorText(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Could not open the PDF";
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

const interviewStageLabels: Record<InterviewStage, string> = {
  offered: "Interview offered",
  moved_forward: "Moved forward",
  completed: "Interview completed",
};

const interviewStageDetails: Record<InterviewStage, string> = {
  offered: "Interview offered.",
  moved_forward: "Moved forward. Waiting on the next level.",
  completed: "Interview completed. Waiting on a response.",
};

function InterviewPill({ stage }: { stage: InterviewStage }) {
  return <span className="status-pill status-interview">{interviewStageLabels[stage]}</span>;
}

function ApplicationView({
  application,
  onClose,
  onEdit,
  onDelete,
}: {
  application: JobApplication;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function openDocument(kind: "resume" | "cover") {
    setError(null);
    void openApplicationDocument(application.id, kind).catch((caught: unknown) => {
      setError(errorText(caught));
    });
  }

  return (
    <Modal title={application.companyName} centered>
      <div className="application-details">
        <p>
          <StatusPill status={application.status} />
        </p>
        <p>
          {application.interviewStage
            ? interviewStageDetails[application.interviewStage]
            : "No interview."}
        </p>
        <p>{application.role.trim() ? application.role : "No role."}</p>
        <p>Applied on {application.appliedOn}</p>
        <p>{application.description.trim() ? application.description : "No description."}</p>
        <p>{application.resumePath ? "Resume is on file." : "No resume."}</p>
        <p>{application.coverPath ? "Cover letter is on file." : "No cover letter."}</p>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="application-actions">
          <button className="button" type="button" onClick={onEdit}>
            Edit
          </button>
          <button className="button" type="button" onClick={onDelete}>
            Delete
          </button>
          {application.resumePath ? (
            <button className="button" type="button" onClick={() => openDocument("resume")}>
              View resume
            </button>
          ) : null}
          {application.coverPath ? (
            <button className="button" type="button" onClick={() => openDocument("cover")}>
              View cover letter
            </button>
          ) : null}
          <button className="button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

const applicationStatuses: ApplicationStatus[] = ["applied", "declined", "rejected", "hired"];

type ApplicationOrder = "newest" | "oldest" | "az" | "za";

function matchesName(application: JobApplication, name: string) {
  const query = name.trim().toLowerCase();
  if (!query) {
    return true;
  }
  return (
    application.companyName.toLowerCase().includes(query) || application.role.toLowerCase().includes(query)
  );
}

function orderedApplications(
  applications: JobApplication[],
  status: ApplicationStatus | "all",
  date: string,
  name: string,
  interviewOnly: boolean,
  order: ApplicationOrder,
) {
  const filtered = applications.filter((application) => {
    if (status !== "all" && application.status !== status) {
      return false;
    }
    if (interviewOnly && !application.interviewStage) {
      return false;
    }
    if (date && application.appliedOn !== date) {
      return false;
    }
    return matchesName(application, name);
  });
  const sorted = [...filtered];
  sorted.sort((left, right) => {
    if (order === "az" || order === "za") {
      const byName =
        left.companyName.localeCompare(right.companyName) || left.role.localeCompare(right.role);
      return order === "az" ? byName : -byName;
    }
    const byDate = left.appliedOn.localeCompare(right.appliedOn);
    if (byDate !== 0) {
      return order === "newest" ? -byDate : byDate;
    }
    return right.id - left.id;
  });
  return sorted;
}

const statusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  declined: "Declined",
  rejected: "Rejected",
  hired: "Hired",
};

function ApplicationCounts({
  applications,
  status,
  interviewOnly,
  onStatus,
  onInterview,
}: {
  applications: JobApplication[];
  status: ApplicationStatus | "all";
  interviewOnly: boolean;
  onStatus: (status: ApplicationStatus | "all") => void;
  onInterview: () => void;
}) {
  const counts: Record<ApplicationStatus | "interview", number> = {
    applied: 0,
    declined: 0,
    rejected: 0,
    hired: 0,
    interview: 0,
  };
  for (const application of applications) {
    counts[application.status] += 1;
    if (application.interviewStage) {
      counts.interview += 1;
    }
  }

  return (
    <div className="application-stats">
      <button
        className="application-stat"
        type="button"
        aria-pressed={status === "all" && !interviewOnly}
        onClick={() => {
          if (status !== "all") {
            onStatus("all");
          }
          if (interviewOnly) {
            onInterview();
          }
        }}
      >
        <strong>{applications.length}</strong>
        <span>All</span>
      </button>
      {applicationStatuses.map((item) => (
        <button
          key={item}
          className={`application-stat status-${item}`}
          type="button"
          aria-pressed={status === item}
          onClick={() => onStatus(status === item ? "all" : item)}
        >
          <strong>{counts[item]}</strong>
          <span>{statusLabels[item]}</span>
        </button>
      ))}
      <button
        className="application-stat status-interview"
        type="button"
        aria-pressed={interviewOnly}
        onClick={onInterview}
      >
        <strong>{counts.interview}</strong>
        <span>Interview</span>
      </button>
    </div>
  );
}

export function ApplicationsPage() {
  const { applications, reload } = usePortfolio();
  const [view, setView] = useState<JobApplication | null>(null);
  const [editor, setEditor] = useState<JobApplication | null | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [interviewOnly, setInterviewOnly] = useState(false);
  const [order, setOrder] = useState<ApplicationOrder>("newest");
  const statusFilterId = useId();
  const dateFilterId = useId();
  const nameFilterId = useId();
  const orderId = useId();
  const removal = useDelete("application");
  const visible = orderedApplications(
    applications,
    statusFilter,
    dateFilter,
    nameFilter,
    interviewOnly,
    order,
  );

  useEffect(() => {
    if (!view) {
      return;
    }
    const fresh = applications.find((item) => item.id === view.id);
    if (!fresh) {
      setView(null);
      return;
    }
    if (fresh !== view) {
      setView(fresh);
    }
  }, [applications, view]);

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
      <ApplicationCounts
        applications={applications}
        status={statusFilter}
        interviewOnly={interviewOnly}
        onStatus={setStatusFilter}
        onInterview={() => setInterviewOnly((current) => !current)}
      />
      {applications.length === 0 ? (
        <p>No records yet.</p>
      ) : (
        <>
          <div className="application-filters">
            <label className="name-filter" htmlFor={nameFilterId}>
              Name
              <input
                id={nameFilterId}
                type="search"
                value={nameFilter}
                placeholder="Company or role"
                onChange={(event) => setNameFilter(event.target.value)}
              />
            </label>
            <label htmlFor={statusFilterId}>
              Status
              <select
                id={statusFilterId}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | "all")}
              >
                <option value="all">All</option>
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={dateFilterId}>
              Date
              <input
                id={dateFilterId}
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </label>
            <label htmlFor={orderId}>
              Order
              <select id={orderId} value={order} onChange={(event) => setOrder(event.target.value as ApplicationOrder)}>
                <option value="newest">Newest date</option>
                <option value="oldest">Oldest date</option>
                <option value="az">Alphabetical</option>
                <option value="za">Alphabetical, reverse</option>
              </select>
            </label>
          </div>
          {visible.length === 0 ? (
            <p>No applications match.</p>
          ) : (
            <table className="record-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div>{application.companyName}</div>
                      {application.role.trim() ? <div>{application.role}</div> : null}
                      <div className="application-summary">
                        <span>{application.appliedOn}</span>
                        <StatusPill status={application.status} />
                        {application.interviewStage ? <InterviewPill stage={application.interviewStage} /> : null}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions row-actions-single">
                        <button
                          className={`button view-button status-${application.status}`}
                          type="button"
                          aria-pressed={view?.id === application.id}
                          onClick={() => setView(application)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      {editor !== undefined ? (
        <ApplicationEditor
          application={editor}
          onClose={() => setEditor(undefined)}
          onSaved={async () => {
            await reload();
            setEditor(undefined);
          }}
        />
      ) : view ? (
        <ApplicationView
          application={view}
          onClose={() => setView(null)}
          onEdit={() => setEditor(view)}
          onDelete={() => removal.ask(view.id, view.companyName)}
        />
      ) : null}
      {removal.dialog}
    </div>
  );
}
