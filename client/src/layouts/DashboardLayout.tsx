import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession, login } from "../api";
import { onAuthFailure } from "../dashboardToken";
import { useQuery } from "../useQuery";
import { PortfolioProvider } from "../dashboard/PortfolioData";

const links = [
  { to: "/dashboard", label: "Home", end: true },
  { to: "/dashboard/profile", label: "Profile", end: false },
  { to: "/dashboard/projects", label: "Projects", end: false },
  { to: "/dashboard/certifications", label: "Certificates", end: false },
  { to: "/dashboard/experience", label: "Experience", end: false },
  { to: "/dashboard/education", label: "Education", end: false },
  { to: "/dashboard/coursework", label: "Coursework", end: false },
  { to: "/dashboard/skills", label: "Skills", end: false },
  { to: "/dashboard/references", label: "References", end: false },
  { to: "/dashboard/applications", label: "Applications", end: false },
  { to: "/dashboard/token", label: "API token", end: false },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "dashboard-link active" : "dashboard-link";
}

function LoginForm({ expired, onSuccess }: { expired: boolean; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      setPassword("");
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <h1>Log in</h1>
      {expired ? <p>Your login expired. Log in again.</p> : null}
      <form className="login-form" onSubmit={onSubmit}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="button button-primary" type="submit" disabled={submitting}>
          Log in
        </button>
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </main>
  );
}

export function DashboardLayout() {
  const query = useQuery(getSession);
  const location = useLocation();
  const [signedIn, setSignedIn] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const authenticated = !needsLogin && (signedIn || (query.status === "ready" && query.data.authenticated));

  useEffect(() => onAuthFailure(() => setNeedsLogin(true)), []);

  if (query.status === "loading" && !signedIn) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    );
  }

  if (query.status === "error" && !signedIn) {
    return (
      <main>
        <p>Could not check login. {query.message}</p>
      </main>
    );
  }

  if (!authenticated) {
    if (location.pathname !== "/dashboard") {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <LoginForm
        expired={needsLogin}
        onSuccess={() => {
          setNeedsLogin(false);
          setSignedIn(true);
        }}
      />
    );
  }

  return (
    <div className="dashboard-shell">
      <nav className="dashboard-nav" aria-label="Dashboard">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
            {link.label}
          </NavLink>
        ))}
        <Link className="dashboard-link" to="/">
          Portfolio
        </Link>
      </nav>
      <div className="dashboard-content">
        <PortfolioProvider>
          <Outlet />
        </PortfolioProvider>
      </div>
    </div>
  );
}
