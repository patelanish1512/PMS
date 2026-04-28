import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Alert, Spinner } from 'react-bootstrap';
import MainLayout from './layout/MainLayout';
import { useAuthStore } from './store/useAuthStore';
import { PermissionProvider } from './context/PermissionProvider';
import { usePermissions } from './context/usePermissions';
import AppErrorBoundary from './components/AppErrorBoundary';

const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('./features/projects/ProjectsPage'));
const TasksPage = lazy(() => import('./features/tasks/TasksPage'));
const MilestonesPage = lazy(() => import('./features/milestones/MilestonesPage'));
const TimeTrackingPage = lazy(() => import('./features/time-tracking/TimeTrackingPage'));
const DocumentsPage = lazy(() => import('./features/documents/DocumentsPage'));
const CompaniesPage = lazy(() => import('./features/companies/CompaniesPage'));
const TeamPage = lazy(() => import('./features/team/TeamPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const ReportsPage = lazy(() => import('./features/reports/ReportsPage'));

const PageFallback = () => (
  <div className="d-flex align-items-center justify-content-center py-5">
    <Spinner animation="border" variant="primary" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PermissionRoute = ({ module, children }: { module: string; children: React.ReactNode }) => {
  const { can, isLoading } = usePermissions();

  if (isLoading) return <PageFallback />;
  if (!can(module, 'canView')) {
    return (
      <Alert variant="warning" className="border-0 rounded-3">
        You do not have permission to view this module. Ask an admin to update your role access.
      </Alert>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <AppErrorBoundary>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <PermissionProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<PermissionRoute module="dashboard"><DashboardPage /></PermissionRoute>} />
                        <Route path="/projects" element={<PermissionRoute module="projects"><ProjectsPage /></PermissionRoute>} />
                        <Route path="/tasks" element={<PermissionRoute module="tasks"><TasksPage /></PermissionRoute>} />
                        <Route path="/milestones" element={<PermissionRoute module="milestones"><MilestonesPage /></PermissionRoute>} />
                        <Route path="/time" element={<PermissionRoute module="timelogs"><TimeTrackingPage /></PermissionRoute>} />
                        <Route path="/documents" element={<PermissionRoute module="documents"><DocumentsPage /></PermissionRoute>} />
                        <Route path="/companies" element={<PermissionRoute module="companies"><CompaniesPage /></PermissionRoute>} />
                        <Route path="/team" element={<PermissionRoute module="team"><TeamPage /></PermissionRoute>} />
                        <Route path="/reports" element={<PermissionRoute module="reports"><ReportsPage /></PermissionRoute>} />
                        <Route path="/settings" element={<PermissionRoute module="settings"><SettingsPage /></PermissionRoute>} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </PermissionProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
