import { useId, useState, type FormEvent } from "react";
import type { Profile } from "../api";
import {
  createApplication,
  createEntry,
  createReference,
  createSkill,
  saveProfile,
  updateApplication,
  updateEntry,
  updateReference,
  updateSkill,
  uploadImage,
  type ApplicationStatus,
  type EntryInput,
  type EntryKind,
  type JobApplication,
  type ManagedEntry,
  type Reference,
  type Skill,
} from "./api";
import { Modal } from "./Modal";
import { mediaUrl } from "../serverUrl";

export const entryKinds: { kind: EntryKind; heading: string; title: string; subtitle: string }[] = [
  { kind: "project", heading: "Projects", title: "Title", subtitle: "Subtitle" },
  { kind: "certificate", heading: "Certificates", title: "Title", subtitle: "Subtitle" },
  { kind: "experience", heading: "Experience", title: "Role", subtitle: "Employer" },
  { kind: "education", heading: "Education", title: "School", subtitle: "Degree" },
  { kind: "coursework", heading: "Coursework", title: "Name", subtitle: "Abbreviation" },
];

const statuses: ApplicationStatus[] = ["applied", "declined", "rejected", "hired"];

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Could not save";
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label}
      {multiline ? (
        <textarea id={id} rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label}
      <input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FormActions({ busy, onClose }: { busy: boolean; onClose: () => void }) {
  return (
    <div className="row-actions">
      <button className="button button-primary" type="submit" disabled={busy}>
        Save
      </button>
      <button className="button" type="button" onClick={onClose} disabled={busy}>
        Cancel
      </button>
    </div>
  );
}

export function ProfileEditor({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [sex, setSex] = useState(profile.sex ?? "");
  const [languages, setLanguages] = useState(profile.languages.join(", "));
  const [notes, setNotes] = useState(profile.notes);
  const [photoPath, setPhotoPath] = useState(profile.photoPath);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileId = useId();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let nextPhoto = photoPath;
      if (file) {
        nextPhoto = (await uploadImage(file)).imagePath;
      }
      await saveProfile({
        ...profile,
        firstName,
        lastName,
        phone,
        email,
        birthDate,
        sex,
        languages: languages
          .split(",")
          .map((language) => language.trim())
          .filter((language) => language.length > 0),
        notes,
        photoPath: nextPhoto,
      });
      await onSaved();
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit profile">
      <form className="editor-form" onSubmit={onSubmit}>
        <TextField label="First name" value={firstName} onChange={setFirstName} />
        <TextField label="Last name" value={lastName} onChange={setLastName} />
        <TextField label="Phone" value={phone} onChange={setPhone} />
        <TextField label="Email" value={email} onChange={setEmail} />
        <DateField label="Birth date" value={birthDate} onChange={setBirthDate} />
        <TextField label="Sex" value={sex} onChange={setSex} />
        <TextField label="Languages" value={languages} onChange={setLanguages} />
        <TextField label="Notes" value={notes} onChange={setNotes} multiline />
        <TextField label="Photo path" value={photoPath} onChange={setPhotoPath} />
        <label className="field" htmlFor={fileId}>
          Photo
          <input
            id={fileId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {photoPath ? <img className="preview-image" src={mediaUrl(photoPath)} alt="" /> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function EntryEditor({
  kind,
  entry,
  skills,
  labels,
  onClose,
  onSaved,
}: {
  kind: EntryKind;
  entry: ManagedEntry | null;
  skills: Skill[];
  labels: { title: string; subtitle: string };
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [subtitle, setSubtitle] = useState(entry?.subtitle ?? "");
  const [shortDescription, setShortDescription] = useState(entry?.shortDescription ?? "");
  const [longDescription, setLongDescription] = useState(entry?.longDescription ?? "");
  const [imagePath, setImagePath] = useState(entry?.imagePath ?? "");
  const [linkUrl, setLinkUrl] = useState(entry?.linkUrl ?? "");
  const [startedOn, setStartedOn] = useState(entry?.startedOn ?? "");
  const [endedOn, setEndedOn] = useState(entry?.endedOn ?? "");
  const [skillIds, setSkillIds] = useState<number[]>(entry?.skills.map((skill) => skill.id) ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileId = useId();

  function toggleSkill(id: number) {
    setSkillIds((current) => (current.includes(id) ? current.filter((skillId) => skillId !== id) : [...current, id]));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let nextImage = imagePath;
      if (file) {
        nextImage = (await uploadImage(file)).imagePath;
      }
      const body: EntryInput = {
        kind,
        title,
        subtitle,
        shortDescription,
        longDescription,
        imagePath: nextImage,
        linkUrl,
        startedOn,
        endedOn,
        skillIds,
      };
      if (entry) {
        await updateEntry(entry.id, body);
      } else {
        await createEntry(body);
      }
      await onSaved();
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={entry ? `Edit ${labels.title.toLowerCase()}` : `Add ${labels.title.toLowerCase()}`}>
      <form className="editor-form" onSubmit={onSubmit}>
        <TextField label={labels.title} value={title} onChange={setTitle} />
        <TextField label={labels.subtitle} value={subtitle} onChange={setSubtitle} />
        <TextField label="Short description" value={shortDescription} onChange={setShortDescription} multiline />
        <TextField label="Long description" value={longDescription} onChange={setLongDescription} multiline />
        <TextField label="Link" value={linkUrl} onChange={setLinkUrl} />
        <DateField label={kind === "coursework" ? "Date" : "Start"} value={startedOn} onChange={setStartedOn} />
        {kind === "coursework" ? null : (
          <DateField label="End" value={endedOn} onChange={setEndedOn} />
        )}
        {kind === "experience" ? <p>Leave the end date empty if this role is current.</p> : null}
        <TextField label="Image path" value={imagePath} onChange={setImagePath} />
        <label className="field" htmlFor={fileId}>
          Image
          <input
            id={fileId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {imagePath ? <img className="preview-image" src={mediaUrl(imagePath)} alt="" /> : null}
        <fieldset className="skill-list">
          <legend>Skills</legend>
          {skills.length === 0 ? <p>No skills yet.</p> : null}
          {skills.map((skill) => (
            <label key={skill.id}>
              <input
                type="checkbox"
                checked={skillIds.includes(skill.id)}
                onChange={() => toggleSkill(skill.id)}
              />
              {skill.name}
            </label>
          ))}
        </fieldset>
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function SkillEditor({
  skill,
  onClose,
  onSaved,
}: {
  skill: Skill | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(skill?.name ?? "");
  const [shortDescription, setShortDescription] = useState(skill?.shortDescription ?? "");
  const [longDescription, setLongDescription] = useState(skill?.longDescription ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { name, shortDescription, longDescription };
      if (skill) {
        await updateSkill(skill.id, body);
      } else {
        await createSkill(body);
      }
      await onSaved();
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={skill ? "Edit skill" : "Add skill"}>
      <form className="editor-form" onSubmit={onSubmit}>
        <TextField label="Name" value={name} onChange={setName} />
        <TextField label="Short description" value={shortDescription} onChange={setShortDescription} />
        <TextField label="Long description" value={longDescription} onChange={setLongDescription} multiline />
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function ReferenceEditor({
  reference,
  onClose,
  onSaved,
}: {
  reference: Reference | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(reference?.firstName ?? "");
  const [lastName, setLastName] = useState(reference?.lastName ?? "");
  const [email, setEmail] = useState(reference?.email ?? "");
  const [shortDescription, setShortDescription] = useState(reference?.shortDescription ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { firstName, lastName, email, shortDescription };
      if (reference) {
        await updateReference(reference.id, body);
      } else {
        await createReference(body);
      }
      await onSaved();
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={reference ? "Edit reference" : "Add reference"}>
      <form className="editor-form" onSubmit={onSubmit}>
        <TextField label="First name" value={firstName} onChange={setFirstName} />
        <TextField label="Last name" value={lastName} onChange={setLastName} />
        <TextField label="Email" value={email} onChange={setEmail} />
        <TextField label="Short description" value={shortDescription} onChange={setShortDescription} multiline />
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function ApplicationEditor({
  application,
  onClose,
  onSaved,
}: {
  application: JobApplication | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [companyName, setCompanyName] = useState(application?.companyName ?? "");
  const [appliedOn, setAppliedOn] = useState(application?.appliedOn ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? "applied");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusId = useId();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { companyName, appliedOn, status };
      if (application) {
        await updateApplication(application.id, body);
      } else {
        await createApplication(body);
      }
      await onSaved();
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={application ? "Edit application" : "Add application"}>
      <form className="editor-form" onSubmit={onSubmit}>
        <TextField label="Company" value={companyName} onChange={setCompanyName} />
        <DateField label="Date applied" value={appliedOn} onChange={setAppliedOn} />
        <label className="field" htmlFor={statusId}>
          Status
          <select id={statusId} value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function RecordTable({
  rows,
  onEdit,
  onDelete,
  onMove,
  moving,
}: {
  rows: { id: number; primary: string; secondary: string }[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onMove?: (id: number, direction: "up" | "down") => void;
  moving?: boolean;
}) {
  if (rows.length === 0) {
    return <p>No records yet.</p>;
  }
  return (
    <table className="record-table">
      <thead>
        <tr>
          <th>Record</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id}>
            <td>
              <div>{row.primary}</div>
              {row.secondary ? <div>{row.secondary}</div> : null}
            </td>
            <td>
              <div className="row-actions">
                {onMove ? (
                  <button
                    className="button"
                    type="button"
                    aria-label={`Move ${row.primary} up`}
                    disabled={moving || index === 0}
                    onClick={() => onMove(row.id, "up")}
                  >
                    ↑
                  </button>
                ) : null}
                {onMove ? (
                  <button
                    className="button"
                    type="button"
                    aria-label={`Move ${row.primary} down`}
                    disabled={moving || index === rows.length - 1}
                    onClick={() => onMove(row.id, "down")}
                  >
                    ↓
                  </button>
                ) : null}
                <button className="button" type="button" onClick={() => onEdit(row.id)} disabled={moving}>
                  Edit
                </button>
                <button className="button" type="button" onClick={() => onDelete(row.id)} disabled={moving}>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function entrySecondary(entry: ManagedEntry): string {
  const end = entry.endedOn ? entry.endedOn : entry.kind === "experience" && entry.startedOn ? "Present" : "";
  const dates = [entry.startedOn, end].filter((part) => part).join(" – ");
  return [entry.subtitle, dates].filter((part) => part).join(" · ");
}
