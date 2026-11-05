import { Navigate, Route, Routes } from "react-router-dom";
import {
  ApplicationsPage,
  DashboardHome,
  EntryPage,
  ProfilePage,
  ReferencesPage,
  SkillsPage,
} from "./dashboard/pages";
import { TokenPage } from "./dashboard/TokenPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { PortfolioLayout } from "./layouts/PortfolioLayout";
import { CertificationsPage } from "./pages/CertificationsPage";
import { HomePage } from "./pages/HomePage";
import { ProjectsPage } from "./pages/ProjectsPage";

export function App() {
  return (
    <Routes>
      <Route element={<PortfolioLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/certifications" element={<CertificationsPage />} />
      </Route>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="projects" element={<EntryPage kind="project" />} />
        <Route path="certifications" element={<EntryPage kind="certificate" />} />
        <Route path="experience" element={<EntryPage kind="experience" />} />
        <Route path="education" element={<EntryPage kind="education" />} />
        <Route path="coursework" element={<EntryPage kind="coursework" />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="references" element={<ReferencesPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="token" element={<TokenPage />} />
        <Route path="view" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
