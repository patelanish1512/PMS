import React, { useState } from 'react';
import { Navbar, Nav, Container, Dropdown, Button, Offcanvas } from 'react-bootstrap';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Target, 
  Clock, 
  Upload, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../context/usePermissions';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationsDropdown from './NotificationsDropdown';

const navItems = [
  { id: 'dashboard', module: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'projects', module: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
  { id: 'tasks', module: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { id: 'milestones', module: 'milestones', label: 'Milestones', icon: Target, path: '/milestones' },
  { id: 'time', module: 'timelogs', label: 'Time Tracking', icon: Clock, path: '/time' },
  { id: 'documents', module: 'documents', label: 'Documents', icon: Upload, path: '/documents' },
  { id: 'companies', module: 'companies', label: 'Companies', icon: Building2, path: '/companies' },
  { id: 'team', module: 'team', label: 'Team', icon: Users, path: '/team' },
  { id: 'reports', module: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
  { id: 'settings', module: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { can, isLoading } = usePermissions();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavItems = isLoading ? [] : navItems.filter(item => can(item.module, 'canView'));

  const renderNavItems = (onNavigate?: () => void) => visibleNavItems.map((item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    return (
      <Nav.Link
        key={item.id}
        onClick={() => {
          navigate(item.path);
          onNavigate?.();
        }}
        className={isActive ? 'active' : ''}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </Nav.Link>
    );
  });

  return (
    <div className="min-h-screen d-flex flex-column">
      {/* Navbar */}
      <Navbar sticky="top" expand="lg" className="px-4">
        <Container fluid>
          <div className="d-flex align-items-center gap-3">
            <Button 
              variant="link" 
              className="p-0 text-dark d-lg-none" 
              aria-label="Open navigation"
              onClick={() => setShowMobileNav(true)}
            >
              <Menu size={24} />
            </Button>
            <div className="d-flex align-items-center gap-2">
              <div className="app-brand-mark">
                <Building2 size={20} />
              </div>
              <span className="h5 mb-0 app-brand-text">Project Monitor</span>
            </div>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3">
            <NotificationsDropdown />
            
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="p-0 text-decoration-none d-flex align-items-center gap-2">
                <div className="d-none d-sm-block text-end me-2">
                  <div className="small fw-bold text-dark">{user?.fullName || 'Guest'}</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>{user?.role || 'Member'}</div>
                </div>
                <div 
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: '38px', height: '38px', fontSize: '14px' }}
                >
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'G'}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-sm border-0 mt-2">
                <Dropdown.Item onClick={() => navigate('/settings')}>Profile Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                  <LogOut size={16} /> Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <aside className="sidebar d-none d-lg-block">
          <Nav className="flex-column">
            {renderNavItems()}
          </Nav>
        </aside>

        <Offcanvas show={showMobileNav} onHide={() => setShowMobileNav(false)} className="mobile-sidebar">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title className="d-flex align-items-center gap-2 fw-bold">
              <Building2 size={20} className="text-primary" /> Project Monitor
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column w-100">
              {renderNavItems(() => setShowMobileNav(false))}
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <main className="flex-grow-1 p-4 overflow-auto app-main">
          <Container fluid className="page-shell">
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
