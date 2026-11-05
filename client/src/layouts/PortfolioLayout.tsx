import { NavLink, Outlet } from "react-router-dom";
import { getSession } from "../api";
import { useQuery } from "../useQuery";

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "site-link active" : "site-link";
}

export function PortfolioLayout() {
  const session = useQuery(getSession);
  const showDashboard = session.status === "ready" && session.data.authenticated;

  return (
    <div className="site">
      <header className="site-header">
        <nav className="site-nav" aria-label="Portfolio">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/experience" className={navClass}>
            Experience
          </NavLink>
          <NavLink to="/projects" className={navClass}>
            Projects
          </NavLink>
          <NavLink to="/education" className={navClass}>
            Education
          </NavLink>
          <NavLink to="/certifications" className={navClass}>
            Certifications
          </NavLink>
          {showDashboard ? (
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
          ) : null}
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
}
