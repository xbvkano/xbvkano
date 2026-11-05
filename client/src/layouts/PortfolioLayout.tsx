import { NavLink, Outlet } from "react-router-dom";
import { getSession } from "../api";
import { useQuery } from "../useQuery";

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link active" : "nav-link";
}

export function PortfolioLayout() {
  const session = useQuery(getSession);
  const showDashboard = session.status === "ready" && session.data.authenticated;

  return (
    <>
      <header>
        <nav className="nav">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/projects" className={navClass}>
            Projects
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
      <main>
        <Outlet />
      </main>
    </>
  );
}
