import { useEffect, useState } from "react";
import { createApiToken, getTokenStatus, type TokenStatus } from "../api";
import { useQuery } from "../useQuery";

function formatExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleString();
}

export function TokenPage() {
  const statusQuery = useQuery(getTokenStatus);
  const [visibleToken, setVisibleToken] = useState<string | null>(null);
  const [localExpiry, setLocalExpiry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!visibleToken) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setVisibleToken(null);
      setCopied(false);
    }, 60_000);
    return () => window.clearTimeout(timeout);
  }, [visibleToken]);

  async function onGenerate() {
    setCreating(true);
    setError(null);
    setCopied(false);
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

  async function onCopy() {
    if (!visibleToken) {
      return;
    }
    try {
      await navigator.clipboard.writeText(visibleToken);
      setCopied(true);
    } catch {
      setError("Could not copy the token");
    }
  }

  const status: TokenStatus | null = localExpiry
    ? { active: true, expiresAt: localExpiry }
    : statusQuery.status === "ready"
      ? statusQuery.data
      : null;

  return (
    <div className="dashboard-panel">
      <div className="section-heading">
        <div>
          <h1>API token</h1>
          <p className="page-description">
            A token lets an outside assistant read and update this portfolio. It is shown once and lasts 8 hours.
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
          <button className="button" type="button" onClick={onCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
