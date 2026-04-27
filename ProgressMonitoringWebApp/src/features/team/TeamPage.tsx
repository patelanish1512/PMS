import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Dropdown, Form, Badge, Modal, Spinner, Table } from 'react-bootstrap';
import {
  Calendar,
  CheckCircle2,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPen,
  XCircle,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { usePermissions } from '../../context/usePermissions';
import { useAuthStore } from '../../store/useAuthStore';

type TeamDirectoryMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  phone?: string;
  location?: string;
  department?: string;
  status?: string;
  avatar?: string;
  activeProjects?: number;
  tasksAssigned?: number;
  tasksCompleted?: number;
  hoursThisWeek?: number;
  utilization?: number;
  joinedDate?: string;
};

type TeamFormState = {
  fullName: string;
  email: string;
  role: string;
  designation: string;
  phone: string;
  location: string;
  department: string;
};

const roleValues: Record<string, number> = {
  Admin: 0,
  ProjectManager: 1,
  Member: 2,
  Client: 3,
};

const emptyForm: TeamFormState = {
  fullName: '',
  email: '',
  role: 'Member',
  designation: '',
  phone: '',
  location: '',
  department: '',
};

const TeamPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamDirectoryMember | null>(null);
  const [form, setForm] = useState<TeamFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const { can } = usePermissions();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery<TeamDirectoryMember[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await apiClient.get<TeamDirectoryMember[]>('/Users');
      return response.data;
    },
  });

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) => [
      member.name,
      member.email,
      member.role,
      member.department,
      member.designation,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [members, searchQuery]);

  const openCreateModal = () => {
    setError(null);
    setEditingMember(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (member: TeamDirectoryMember) => {
    setError(null);
    setEditingMember(member);
    setForm({
      fullName: member.name,
      email: member.email,
      role: member.role,
      designation: member.designation || '',
      phone: member.phone || '',
      location: member.location || '',
      department: member.department || '',
    });
    setShowModal(true);
  };

  const payloadFromForm = () => ({
    fullName: form.fullName,
    email: form.email,
    role: roleValues[form.role] ?? roleValues.Member,
    designation: form.designation,
    phone: form.phone,
    location: form.location,
    department: form.department,
  });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.post('/Users', payloadFromForm()),
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: () => setError('Unable to create this team member. Check the email and try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => apiClient.put(`/Users/${editingMember?.id}`, payloadFromForm()),
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: () => setError('Unable to update this team member. Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/Users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiClient.put(`/Users/${id}/status`, JSON.stringify(status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }

    if (editingMember) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-2 py-1 rounded-pill small">ADMIN</Badge>;
      case 'projectmanager': return <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1 rounded-pill small">MANAGER</Badge>;
      case 'client': return <Badge bg="info-subtle" className="text-info border border-info-subtle px-2 py-1 rounded-pill small">CLIENT</Badge>;
      default: return <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle px-2 py-1 rounded-pill small">MEMBER</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Team Members...</p>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Team Management</h1>
          <p className="text-muted mb-0">Manage roles, status, and directory access</p>
        </div>
        {can('team', 'canCreate') && (
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={openCreateModal}>
            <Plus size={20} /> Invite Member
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <Card.Body className="p-4">
          <div className="position-relative">
            <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
            <Form.Control
              placeholder="Search by name, email, role, or department..."
              className="ps-5 bg-light border-0 py-2.5 rounded-3"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-secondary small fw-bold border-0">TEAM MEMBER</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0">ROLE</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0 text-center">STATUS</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0 text-center">WORKLOAD</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0 text-center">JOINED DATE</th>
              {(can('team', 'canEdit') || can('team', 'canDelete')) && <th className="py-3 px-4 text-secondary small fw-bold border-0 text-end">ACTIONS</th>}
            </tr>
          </thead>
          <tbody className="border-0">
            {filteredMembers.map((member) => {
              const initials = (member.avatar || member.name.substring(0, 2)).substring(0, 2).toUpperCase();
              const isActive = (member.status || 'active').toLowerCase() === 'active';
              const canDeleteMember = can('team', 'canDelete') && member.id !== user?.id;

              return (
                <tr key={member.id} className="border-bottom">
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                        {initials}
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{member.name}</div>
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <Mail size={12} /> {member.email}
                        </div>
                        {member.designation && <div className="text-muted small">{member.designation}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                      <Shield size={14} className="text-muted" />
                      {getRoleBadge(member.role)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge bg={isActive ? 'success-subtle' : 'secondary-subtle'} className={`${isActive ? 'text-success border-success-subtle' : 'text-secondary border-secondary-subtle'} border px-2 py-1 rounded-pill small`}>
                      {isActive ? <CheckCircle2 size={12} className="me-1" /> : <XCircle size={12} className="me-1" />}
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center text-muted small">
                    {member.tasksCompleted ?? 0}/{member.tasksAssigned ?? 0} tasks / {member.utilization ?? 0}%
                  </td>
                  <td className="py-3 px-4 text-center text-muted small">
                    <Calendar size={12} className="me-1" /> {member.joinedDate || '-'}
                  </td>
                  {(can('team', 'canEdit') || can('team', 'canDelete')) && (
                    <td className="py-3 px-4 text-end">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="p-1 text-muted no-caret">
                          <MoreVertical size={18} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-sm">
                          {can('team', 'canEdit') && (
                            <>
                              <Dropdown.Item onClick={() => openEditModal(member)}><UserPen size={14} className="me-2" />Edit Member</Dropdown.Item>
                              <Dropdown.Item onClick={() => statusMutation.mutate({ id: member.id, status: isActive ? 'inactive' : 'active' })}>
                                {isActive ? 'Deactivate' : 'Activate'}
                              </Dropdown.Item>
                            </>
                          )}
                          {canDeleteMember && (
                            <Dropdown.Item className="text-danger" onClick={() => window.confirm('Delete this team member?') && deleteMutation.mutate(member.id)}>
                              <Trash2 size={14} className="me-2" />Delete Member
                            </Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
        {filteredMembers.length === 0 && (
          <div className="text-center py-5 text-muted">No team members match your search.</div>
        )}
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">{editingMember ? 'Edit Team Member' : 'Invite Team Member'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-secondary">Full Name</Form.Label>
                <Form.Control value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="bg-light border-0 py-2.5 rounded-3" required />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-secondary">Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="bg-light border-0 py-2.5 rounded-3" required />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-secondary">Role</Form.Label>
                <Form.Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="bg-light border-0 py-2.5 rounded-3">
                  <option value="Member">Member</option>
                  <option value="ProjectManager">Project Manager</option>
                  <option value="Client">Client</option>
                  <option value="Admin">Admin</option>
                </Form.Select>
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-secondary">Designation</Form.Label>
                <Form.Control value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-bold text-secondary">Phone</Form.Label>
                <Form.Control value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-bold text-secondary">Department</Form.Label>
                <Form.Control value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-bold text-secondary">Location</Form.Label>
                <Form.Control value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="bg-light border-0 py-2.5 rounded-3" />
              </div>
            </div>
            {!editingMember && (
              <p className="text-muted small mt-3 mb-0">New users are created with the temporary password Password@123.</p>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold" disabled={isSaving}>
              {isSaving ? <Spinner size="sm" /> : editingMember ? 'Save Member' : 'Create Member'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamPage;
