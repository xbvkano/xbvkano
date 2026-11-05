import { useEffect, useState } from "react";
import {
  closeOpenHour,
  createApiToken,
  getOpenHour,
  getTokenStatus,
  startOpenHour,
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
  const openText =
    openHour?.open && openHour.openUntil
      ? `Open hour is on until ${formatExpiry(openHour.openUntil)}. Until then, omit the Authorization header. The assistant can read the portfolio and create or update job applications without a token.`
      : "Open hour is off. The assistant must send the token to read the portfolio and update applications.";

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
  const [copied, setCopied] = useState<"token" | "instructions" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [changingHour, setChangingHour] = useState(false);

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

  async function onOpenHour() {
    setChangingHour(true);
    setError(null);
    try {
      setOpenHour(await startOpenHour());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the hour");
    } finally {
      setChangingHour(false);
    }
  }

  async function onCloseHour() {
    setChangingHour(true);
    setError(null);
    try {
      setOpenHour(await closeOpenHour());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not close the hour");
    } finally {
      setChangingHour(false);
    }
  }

  return (
    <div className="dashboard-panel">
      <div className="section-heading">
        <div>
          <h1>API token</h1>
          <p className="page-description">
            During open hour, an assistant can read the portfolio and update job applications without a token. Outside
            that hour, the token is required. The token lasts 8 hours and is shown once.
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
        <h2>Open hour</h2>
        {hour?.open && hour.openUntil ? (
          <p>Open until {formatExpiry(hour.openUntil)}. An assistant can apply without a token.</p>
        ) : (
          <p>Closed. An assistant needs a valid token to read the portfolio or update applications.</p>
        )}
        <div className="token-actions">
          <button className="button button-primary" type="button" onClick={() => void onOpenHour()} disabled={changingHour}>
            Open for 1 hour
          </button>
          <button className="button" type="button" onClick={() => void onCloseHour()} disabled={changingHour || !hour?.open}>
            Close
          </button>
        </div>
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
