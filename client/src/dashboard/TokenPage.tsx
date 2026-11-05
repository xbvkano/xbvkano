import { useEffect, useState } from "react";
import {
  createApiToken,
  getOpenHour,
  getTokenStatus,
  saveOpenHour,
  type OpenHourStatus,
  type TokenStatus,
} from "../api";
import { serverOrigin, serverUrl } from "../serverUrl";
import { useQuery } from "../useQuery";

function formatExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleString();
}

function instructionText(token: string | null, openHour: OpenHourStatus | null): string {
  const root = serverOrigin() || "the API origin";
  const bearer = token ?? "<paste the token here>";
  const openText = openHour?.enabled
    ? `Schedule your job
Run the job every day during this window. Nobody needs to be present, and no token is required during the window.

Start: ${openHour.startsAt}
End: ${openHour.endsAt}
Time zone: ${openHour.timeZone}

The window opens at the start time and closes at the end time. Schedule the job for this same window. During the window, omit the Authorization header. You can read the portfolio, create or update job applications, and read or save notes.
Outside the window, send the bearer token below.`
    : `Schedule your job
The daily open-hour window is turned off. There is no token-free time. Send the bearer token on every request.`;

  return `Portfolio API for job applications

Server root: ${root}

${openText}

Send this header when a token is required:
Authorization: Bearer ${bearer}

The token lasts 8 hours. It can read the portfolio, list and update job applications, and save application notes. It cannot change the profile, projects, experience, or other dashboard records.

Health check
1. Server, no token:
GET ${serverUrl("/api/health")}
Expect {"ok":true}

2. Token, always send the bearer token, even during open hour:
GET ${serverUrl("/api/external/health")}
Expect {"ok":true,"token":"active","database":"ok"}
401 means the token is missing, invalid, or expired.

Read the portfolio
GET ${serverUrl("/api/external/portfolio")}
This includes profile, experience, education, projects, certificates, skills, coursework, references, and assistantNotes.
GET ${serverUrl("/api/external/applications")}
GET ${serverUrl("/api/coursework")}
Coursework is public and does not need a token.

Update a job application by id
PUT ${serverUrl("/api/external/applications")}/<id>
{"companyName":"Example Co","appliedOn":"YYYY-MM-DD","status":"applied"}
status is one of: applied, declined, rejected, hired.

Upsert a job application by company name
PUT ${serverUrl("/api/external/applications")}
Same JSON body. If that company already has an application, update it. Otherwise create it.

Application notes
These notes are not shown on the dashboard. Use them to remember answers that job forms ask for, such as veteran status. Read them before answering. Save a new answer when a new question appears. The same topic updates the previous note.
GET ${serverUrl("/api/external/notes")}
PUT ${serverUrl("/api/external/notes")}
{"topic":"veteran status","question":"Are you a veteran?","answer":"No"}
A token can read and save notes during and outside open hour. During open hour, no token is required.`;
}

export function TokenPage() {
  const statusQuery = useQuery(getTokenStatus);
  const openHourQuery = useQuery(getOpenHour);
  const [visibleToken, setVisibleToken] = useState<string | null>(null);
  const [localExpiry, setLocalExpiry] = useState<string | null>(null);
  const [openHour, setOpenHour] = useState<OpenHourStatus | null>(null);
  const [draft, setDraft] = useState<OpenHourStatus | null>(null);
  const [copied, setCopied] = useState<"token" | "instructions" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingHour, setSavingHour] = useState(false);

  useEffect(() => {
    if (!visibleToken) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setVisibleToken(null);
      setCopied((current) => (current === "token" ? null : current));
    }, 60_000);
    return () => window.clearTimeout(timeout);
  }, [visibleToken]);

  const status: TokenStatus | null = localExpiry
    ? { active: true, expiresAt: localExpiry }
    : statusQuery.status === "ready"
      ? statusQuery.data
      : null;
  const hour = openHour ?? (openHourQuery.status === "ready" ? openHourQuery.data : null);
  const form = draft ?? hour;

  async function onGenerate() {
    setCreating(true);
    setError(null);
    setCopied(null);
    try {
      const issued = await createApiToken();
      setVisibleToken(issued.token);
      setLocalExpiry(issued.expiresAt);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create token");
    } finally {
      setCreating(false);
    }
  }

  async function onCopy(value: string, kind: "token" | "instructions") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setError(null);
    } catch {
      setError(kind === "token" ? "Could not copy the token" : "Could not copy the instructions");
    }
  }

  async function onSaveHour() {
    if (!form) {
      return;
    }
    setSavingHour(true);
    setError(null);
    try {
      const saved = await saveOpenHour({
        enabled: form.enabled,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        timeZone: form.timeZone.trim(),
      });
      setOpenHour(saved);
      setDraft(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the schedule");
    } finally {
      setSavingHour(false);
    }
  }

  return (
    <div className="dashboard-panel">
      <div className="section-heading">
        <div>
          <h1>API token</h1>
          <p className="page-description">
            Set a daily window, such as 3:00 AM to 8:00 AM. During that window an assistant can read the portfolio
            and update job applications without a token. Schedule the job inside the window. Outside it, the token is
            required. The token lasts 8 hours and is shown once.
          </p>
        </div>
      </div>
      {statusQuery.status === "loading" && !status ? <p>Loading...</p> : null}
      {statusQuery.status === "error" && !status ? (
        <p>Could not load token status. {statusQuery.message}</p>
      ) : null}
      {status?.active ? <p>A token is active until {formatExpiry(status.expiresAt)}.</p> : null}
      {status && !status.active && status.status ? <p>{status.status}</p> : null}
      {status && !status.active && !status.status ? <p>No token yet.</p> : null}
      <button className="button button-primary" type="button" onClick={onGenerate} disabled={creating}>
        Generate token
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {visibleToken ? (
        <div className="token-reveal">
          <p className="token-value">{visibleToken}</p>
          <button className="button" type="button" onClick={() => void onCopy(visibleToken, "token")}>
            {copied === "token" ? "Copied" : "Copy token"}
          </button>
        </div>
      ) : null}

      <section className="token-section">
        <h2>Open hours</h2>
        {hour?.enabled && hour.open ? (
          <p>
            Open now, until {hour.endsAt} {hour.timeZone}. An assistant can apply without a token.
          </p>
        ) : null}
        {hour?.enabled && !hour.open ? (
          <p>
            Closed. The daily window is {hour.startsAt} to {hour.endsAt} {hour.timeZone}. Schedule the job inside that
            window.
          </p>
        ) : null}
        {hour && !hour.enabled ? <p>The daily window is off. An assistant needs a valid token.</p> : null}
        {form ? (
          <div className="schedule-fields">
            <label className="field">
              Start
              <input
                type="time"
                value={form.startsAt}
                onChange={(event) => setDraft({ ...form, startsAt: event.target.value })}
              />
            </label>
            <label className="field">
              End
              <input
                type="time"
                value={form.endsAt}
                onChange={(event) => setDraft({ ...form, endsAt: event.target.value })}
              />
            </label>
            <label className="field">
              Time zone
              <input
                value={form.timeZone}
                onChange={(event) => setDraft({ ...form, timeZone: event.target.value })}
              />
            </label>
            <label className="schedule-toggle">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => setDraft({ ...form, enabled: event.target.checked })}
              />
              Use this window
            </label>
          </div>
        ) : null}
        <button className="button button-primary" type="button" onClick={() => void onSaveHour()} disabled={savingHour || !form}>
          Save schedule
        </button>
      </section>

      <section className="token-section">
        <div className="section-heading">
          <h2>Instructions for the assistant</h2>
          <button
            className="button"
            type="button"
            onClick={() => void onCopy(instructionText(visibleToken, hour), "instructions")}
          >
            {copied === "instructions" ? "Copied" : "Copy instructions"}
          </button>
        </div>
        <pre className="instruction-box">{instructionText(visibleToken, hour)}</pre>
      </section>
    </div>
  );
}
