import React, { useState } from 'react';
import { Alert, Row, Col, Card, Button, Form, Nav, Tab, Spinner } from 'react-bootstrap';
import { 
  User, 
  Shield, 
  Save, 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../context/usePermissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import RoleManager from './RoleManager';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState<Partial<{
    fullName: string;
    phone: string;
    location: string;
    department: string;
    designation: string;
  }>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const canManageRoles = user?.role === 'Admin' || can('settings', 'canEdit');

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const response = await apiClient.get<{
        name: string;
        phone?: string;
        location?: string;
        department?: string;
        designation?: string;
      }>('/Users/me');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const currentProfile = {
    fullName: profileForm.fullName ?? profile?.name ?? user?.fullName ?? '',
    phone: profileForm.phone ?? profile?.phone ?? '',
    location: profileForm.location ?? profile?.location ?? '',
    department: profileForm.department ?? profile?.department ?? '',
    designation: profileForm.designation ?? profile?.designation ?? '',
  };

  const profileMutation = useMutation({
    mutationFn: async () => apiClient.put('/Users/me/profile', currentProfile),
    onSuccess: () => {
      updateUser({ fullName: currentProfile.fullName });
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    },
    onError: () => setMessage({ type: 'danger', text: 'Profile update failed. Please check the details and try again.' }),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => apiClient.put('/Users/me/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully.' });
    },
    onError: () => setMessage({ type: 'danger', text: 'Password change failed. Check your current password and try again.' }),
  });

  const handleSave = () => {
    setMessage(null);
    if (activeTab === 'profile') {
      profileMutation.mutate();
      return;
    }

    if (activeTab === 'security') {
      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        setMessage({ type: 'danger', text: 'Current password and new password are required.' });
        return;
      }

      if (passwordForm.newPassword.length < 8) {
        setMessage({ type: 'danger', text: 'New password must be at least 8 characters.' });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({ type: 'danger', text: 'New password and confirmation do not match.' });
        return;
      }

      passwordMutation.mutate();
    }
  };

  const isSaving = profileMutation.isPending || passwordMutation.isPending;
  const canSave = activeTab === 'profile' || activeTab === 'security';

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Settings</h1>
          <p className="text-muted mb-0">Manage system configuration and your preferences</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? <Spinner size="sm" /> : <Save size={20} />} Save Changes
        </Button>
      </div>

      {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}

      <Tab.Container id="settings-tabs" activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
        <Row>
          <Col lg={3}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-2">
                <Nav variant="pills" className="flex-column gap-1">
                  <Nav.Item>
                    <Nav.Link eventKey="profile" className="d-flex align-items-center gap-3 px-4 py-3 rounded-3 fw-medium">
                      <User size={18} /> Profile
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="security" className="d-flex align-items-center gap-3 px-4 py-3 rounded-3 fw-medium">
                      <Shield size={18} /> Security
                    </Nav.Link>
                  </Nav.Item>
                  {canManageRoles && (
                    <Nav.Item>
                      <Nav.Link eventKey="roles" className="d-flex align-items-center gap-3 px-4 py-3 rounded-3 fw-medium">
                        <Shield size={18} /> Role Manager
                      </Nav.Link>
                    </Nav.Item>
                  )}
                </Nav>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={9}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-5">
                <Tab.Content>
                  <Tab.Pane eventKey="profile">
                    <h4 className="fw-bold mb-4">Personal Information</h4>
                    <Form>
                      <Row className="g-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Full Name</Form.Label>
                            <Form.Control value={currentProfile.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Email Address</Form.Label>
                            <Form.Control defaultValue={user?.email} className="bg-light border-0 py-2.5 rounded-3" disabled />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Phone Number</Form.Label>
                            <Form.Control value={currentProfile.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+1 (000) 000-0000" className="bg-light border-0 py-2.5 rounded-3" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Role</Form.Label>
                            <Form.Control defaultValue={user?.role} className="bg-light border-0 py-2.5 rounded-3" disabled />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Department</Form.Label>
                            <Form.Control value={currentProfile.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Designation</Form.Label>
                            <Form.Control value={currentProfile.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-secondary">Location</Form.Label>
                            <Form.Control value={currentProfile.location} onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </Tab.Pane>
                  <Tab.Pane eventKey="security">
                    <h4 className="fw-bold mb-4">Security Settings</h4>
                    <Form className="max-w-md">
                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-secondary">Current Password</Form.Label>
                        <Form.Control type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="********" className="bg-light border-0 py-2.5 rounded-3" />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-secondary">New Password</Form.Label>
                        <Form.Control type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="********" className="bg-light border-0 py-2.5 rounded-3" />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-secondary">Confirm New Password</Form.Label>
                        <Form.Control type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="********" className="bg-light border-0 py-2.5 rounded-3" />
                      </Form.Group>
                    </Form>
                  </Tab.Pane>
                  {canManageRoles && (
                    <Tab.Pane eventKey="roles">
                      <RoleManager />
                    </Tab.Pane>
                  )}
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
};

export default SettingsPage;
