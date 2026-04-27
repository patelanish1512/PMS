import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAllNotifications, markAsRead as markAsReadApi } from '../services/notificationService';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  FileText,
  Bell,
  Settings as SettingsIcon,
  Building2,
  Users,
  Target,
  Upload,
  LogOut
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import TimeTracking from './components/TimeTracking';
import Companies from './components/Companies';
import Milestones from './components/Milestones';
import Documents from './components/Documents';
import Team from './components/Team';
import Reports from './components/Reports';
import Settings from './components/Settings';
import NotificationsPanel from './components/NotificationsPanel';
import SettingsPanel from './components/SettingsPanel';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';


function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notificationData = await getAllNotifications();
        setNotifications(notificationData);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      }
    };
    fetchData();
  }, []);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const userRole = currentUser.role || 'Member';

  const markAsRead = async (id: string | number) => {
    try {
      if (typeof id === 'string') {
        await markAsReadApi(id);
      }
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'ProjectManager', 'Member', 'Client'] },
    { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['Admin', 'ProjectManager', 'Member', 'Client'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Admin', 'ProjectManager', 'Member'] },
    { id: 'milestones', label: 'Milestones', icon: Target, roles: ['Admin', 'ProjectManager', 'Member', 'Client'] },
    { id: 'time', label: 'Time Tracking', icon: Clock, roles: ['Admin', 'ProjectManager', 'Member'] },
    { id: 'documents', label: 'Documents', icon: Upload, roles: ['Admin', 'ProjectManager', 'Member', 'Client'] },
    { id: 'companies', label: 'Companies', icon: Building2, roles: ['Admin', 'ProjectManager'] },
    { id: 'team', label: 'Team', icon: Users, roles: ['Admin', 'ProjectManager'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['Admin', 'ProjectManager', 'Client'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['Admin', 'ProjectManager'] },
  ].filter(item => item.roles.includes(userRole));



  useEffect(() => {
    if (navigation.length > 0 && !navigation.find(n => n.id === activeTab)) {
      setActiveTab(navigation[0].id);
    }
  }, [userRole, navigation, activeTab]);

  const markAllAsRead = async () => {
    try {
      await import('../services/notificationService').then(s => s.markAllAsRead());
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string | number) => {
    try {
      if (typeof id === 'string') {
        await import('../services/notificationService').then(s => s.deleteNotification(id));
      }
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2 rotate-45">
                <div className="rotate-[-45deg]">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Project Monitor</h1>
                <p className="text-xs text-gray-500">Real-Time Progress Tracking</p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SettingsIcon className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{currentUser.fullName || 'Guest User'}</div>
                  <div className="text-xs text-gray-500">{userRole}</div>
                </div>
                <div
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium relative cursor-pointer"
                >
                  {(currentUser.fullName || 'G').split(' ').map((n: string) => n[0]).join('')}

                  {showProfileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 mt-6 -mb-4 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all whitespace-nowrap ${isActive
                      ? 'bg-gray-50 text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'projects' && <Projects />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'milestones' && <Milestones />}
        {activeTab === 'time' && <TimeTracking />}
        {activeTab === 'documents' && <Documents />}
        {activeTab === 'companies' && <Companies />}
        {activeTab === 'team' && <Team />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
