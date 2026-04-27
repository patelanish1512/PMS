import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, ProgressBar, Spinner, Modal } from 'react-bootstrap';
import { 
  Plus, 
  Search, 
  Target, 
  Calendar, 
  FolderKanban, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Award,
  Trash2
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import type { Milestone, Project } from '../../types/api';
import { toast } from 'sonner';
import { usePermissions } from '../../context/usePermissions';

const MilestonesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ['milestones'],
    queryFn: async () => {
      const response = await apiClient.get<Milestone[]>('/Milestones');
      return response.data;
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects-minimal'],
    queryFn: async () => {
      const response = await apiClient.get<Project[]>('/Projects');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      projectId: string;
      projectName: string;
      title: string;
      description: string;
      dueDate: string;
      status: string;
      priority: number;
      progress: number;
    }) => apiClient.post('/Milestones', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setShowModal(false);
      toast.success('Milestone created');
    },
    onError: () => toast.error('Failed to create milestone'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/Milestones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Milestone deleted');
    },
    onError: () => toast.error('Failed to delete milestone'),
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <Badge bg="success-subtle" className="text-success border border-success-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><CheckCircle2 size={12}/> Completed</Badge>;
      case 'in-progress': return <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><Clock size={12}/> In Progress</Badge>;
      case 'at-risk': return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><AlertCircle size={12}/> At Risk</Badge>;
      default: return <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><Target size={12}/> {status}</Badge>;
    }
  };

  const filteredMilestones = milestones.filter((m: Milestone) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || m.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleCreateMilestone = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const project = projects.find(item => item.id === data.projectId);

    if (!project) {
      toast.error('Select a project');
      return;
    }

    createMutation.mutate({
      projectId: project.id,
      projectName: project.name,
      title: String(data.title || ''),
      description: String(data.description || ''),
      dueDate: new Date(String(data.dueDate || new Date().toISOString())).toISOString(),
      status: String(data.status || 'upcoming'),
      priority: Number(data.priority || 2),
      progress: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Milestones...</p>
      </div>
    );
  }

  const stats = {
    total: milestones.length,
    completed: milestones.filter((m: Milestone) => m.status.toLowerCase() === 'completed').length,
    pending: milestones.filter((m: Milestone) => m.status.toLowerCase() !== 'completed').length,
  };

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Milestones</h1>
          <p className="text-muted mb-0">Track key deliverables and project phases</p>
        </div>
        {can('milestones', 'canCreate') && (
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={() => setShowModal(true)}>
          <Plus size={20} /> New Milestone
        </Button>
        )}
      </div>

      {/* Stats Summary */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm overflow-hidden h-100">
            <Card.Body className="d-flex align-items-center gap-3 p-4">
              <div className="bg-primary-subtle p-3 rounded-4 text-primary">
                <Target size={24} />
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Milestones</div>
                <h4 className="fw-bold mb-0">{stats.total}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm overflow-hidden h-100">
            <Card.Body className="d-flex align-items-center gap-3 p-4">
              <div className="bg-success-subtle p-3 rounded-4 text-success">
                <Award size={24} />
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Completed</div>
                <h4 className="fw-bold mb-0">{stats.completed}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm overflow-hidden h-100">
            <Card.Body className="d-flex align-items-center gap-3 p-4">
              <div className="bg-warning-subtle p-3 rounded-4 text-warning">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Next Pending</div>
                <h4 className="fw-bold mb-0">{stats.pending}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={8}>
              <div className="position-relative">
                <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
                <Form.Control 
                  placeholder="Search milestones..." 
                  className="ps-5 bg-light border-0 py-2.5 rounded-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Col>
            <Col md={4}>
              <Form.Select 
                className="bg-light border-0 py-2.5 rounded-3"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Milestone List */}
      <div className="d-flex flex-column gap-4">
        {filteredMilestones.map((milestone: Milestone) => (
          <Card key={milestone.id} className="border-0 shadow-sm overflow-hidden hover-shadow transition-all">
            <Card.Body className="p-4">
              <Row className="align-items-center g-4">
                <Col lg={1}>
                  <div className={`p-3 rounded-4 text-center ${milestone.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>
                    <Target size={24} />
                  </div>
                </Col>
                <Col lg={5}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="fw-bold mb-0">{milestone.title}</h5>
                    {getStatusBadge(milestone.status)}
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                    <FolderKanban size={14} /> {milestone.project}
                  </div>
                  <p className="text-muted small mb-0 line-clamp-2">{milestone.description}</p>
                </Col>
                <Col lg={4}>
                  <div className="mb-2 d-flex justify-content-between align-items-center">
                    <span className="small fw-bold text-secondary">Progress</span>
                    <span className="small fw-bold text-dark">{milestone.completion}%</span>
                  </div>
                  <ProgressBar now={milestone.completion} variant={milestone.status === 'completed' ? 'success' : 'primary'} style={{ height: '6px' }} className="rounded-pill shadow-none" />
                </Col>
                <Col lg={2} className="text-lg-end">
                  <div className="text-muted small mb-1 d-flex align-items-center justify-content-lg-end gap-1">
                    <Calendar size={14} /> Due Date
                  </div>
                  <div className="fw-bold text-dark">{milestone.dueDate}</div>
                  {can('milestones', 'canDelete') && (
                    <Button variant="link" size="sm" className="text-danger px-0 mt-2 d-inline-flex align-items-center gap-1" onClick={() => deleteMutation.mutate(milestone.id)}>
                      <Trash2 size={14} /> Delete
                    </Button>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Create Milestone</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateMilestone}>
          <Modal.Body className="p-4">
            <div className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Project</Form.Label>
                <Form.Select name="projectId" required className="bg-light border-0 py-2.5">
                  <option value="">Select project</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Title</Form.Label>
                <Form.Control name="title" required className="bg-light border-0 py-2.5" />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Description</Form.Label>
                <Form.Control name="description" as="textarea" rows={3} className="bg-light border-0" />
              </Form.Group>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-secondary">Due Date</Form.Label>
                    <Form.Control name="dueDate" type="date" required className="bg-light border-0 py-2.5" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-secondary">Priority</Form.Label>
                    <Form.Select name="priority" defaultValue="2" className="bg-light border-0 py-2.5">
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <input type="hidden" name="status" value="upcoming" />
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Spinner size="sm" /> : 'Create Milestone'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MilestonesPage;
