import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, ProgressBar, Dropdown, Modal, Spinner } from 'react-bootstrap';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';
import type { Company, Project, ProjectCreateInput } from '../../types/api';
import { usePermissions } from '../../context/usePermissions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100, 'Name is too long'),
  company: z.string().min(1, 'Company is required'),
  budget: z.coerce.number().min(0, 'Budget cannot be negative'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

type ProjectFormInput = z.input<typeof projectSchema>;
type ProjectFormValues = z.output<typeof projectSchema>;

const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', company: '', budget: 0, startDate: '', endDate: '', description: '' }
  });

  // Queries
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<Project[]>('/Projects');
      return response.data;
    },
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Company[]>('/Companies');
        return response.data;
      } catch {
        return [
          { id: '1', name: 'Tech Corp', industry: '', address: '', contactPerson: '' },
          { id: '2', name: 'StartupXYZ', industry: '', address: '', contactPerson: '' },
        ];
      }
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newProject: ProjectCreateInput) => apiClient.post('/Projects', newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      setEditingProject(null);
      toast.success('Project created successfully');
    },
    onError: () => toast.error('Failed to save project'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, project }: { id: string; project: ProjectCreateInput }) => apiClient.put(`/Projects/${id}`, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: () => toast.error('Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/Projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: () => toast.error('Failed to delete project'),
  });

  const handleCreateSubmit = (data: ProjectFormValues) => {
    const payload = {
      ...data,
      team: editingProject?.team || 1,
      description: data.description || '',
    };

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, project: payload as ProjectCreateInput });
      return;
    }

    createMutation.mutate(payload as ProjectCreateInput);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    reset({ name: '', company: '', budget: 0, startDate: '', endDate: '', description: '' });
    setShowModal(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'on-track': return <Badge bg="success-subtle" className="text-success border border-success-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><CheckCircle2 size={12}/> On Track</Badge>;
      case 'at-risk': return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><AlertCircle size={12}/> At Risk</Badge>;
      case 'delayed': return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><AlertCircle size={12}/> Delayed</Badge>;
      default: return <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle px-2 py-1 rounded-pill d-flex align-items-center gap-1"><Clock size={12}/> {health}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Projects...</p>
      </div>
    );
  }

  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         project.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Projects Portfolio</h1>
          <p className="text-muted mb-0">Overview of all active and upcoming projects</p>
        </div>
        {can('projects', 'canCreate') && (
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={openCreateModal}>
          <Plus size={20} /> New Project
        </Button>
        )}
      </div>

      {/* Filters & Search */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={8}>
              <div className="position-relative">
                <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
                <Form.Control 
                  placeholder="Search by project or company name..." 
                  className="ps-5 bg-light border-0 py-2.5 rounded-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2">
                <div className="position-relative flex-grow-1">
                  <Filter className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={16} />
                  <Form.Select 
                    className="ps-5 bg-light border-0 py-2.5 rounded-3"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Project Grid */}
      <Row className="g-4">
        {filteredProjects.map((project: Project) => (
          <Col key={project.id} lg={6}>
            <Card className="border-0 shadow-sm h-100 overflow-hidden project-card">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className="fw-bold mb-0">{project.name}</h5>
                      <Badge bg="primary-subtle" className="text-primary text-uppercase px-2" style={{ fontSize: '10px' }}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Building2 size={14} /> {project.company}
                    </div>
                  </div>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret">
                      <MoreVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow-sm border-0">
                      {can('projects', 'canEdit') && <Dropdown.Item onClick={() => { 
                        setEditingProject(project); 
                        reset({
                          name: project.name,
                          company: project.company,
                          budget: project.budget,
                          startDate: project.startDate,
                          endDate: project.endDate,
                          description: project.description
                        });
                        setShowModal(true); 
                      }}>Edit Project</Dropdown.Item>}
                      <Dropdown.Divider />
                      {can('projects', 'canDelete') && <Dropdown.Item className="text-danger" onClick={() => {
                        if (window.confirm(`Delete ${project.name}? This will remove related tasks, milestones, time logs, and documents.`)) {
                          deleteMutation.mutate(project.id);
                        }
                      }}>Delete Project</Dropdown.Item>}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                <div className="mb-4">
                  {getHealthBadge(project.health)}
                </div>

                <div className="mb-4 p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-secondary">Overall Progress</span>
                    <span className="small fw-bold text-dark">{project.progress}%</span>
                  </div>
                  <ProgressBar 
                    now={project.progress} 
                    variant={project.health === 'on-track' ? 'success' : project.health === 'at-risk' ? 'warning' : 'danger'}
                    style={{ height: '8px' }}
                    className="rounded-pill shadow-none"
                  />
                </div>

                <Row className="g-3 mb-4">
                  <Col xs={6}>
                    <div className="d-flex align-items-center gap-2 text-muted mb-1">
                      <Calendar size={14} /> <span className="small fw-medium">Timeline</span>
                    </div>
                    <div className="small fw-bold text-dark">{project.startDate} - {project.endDate}</div>
                  </Col>
                  <Col xs={6}>
                    <div className="d-flex align-items-center gap-2 text-muted mb-1">
                      <Users size={14} /> <span className="small fw-medium">Team Size</span>
                    </div>
                    <div className="small fw-bold text-dark">{project.team} members</div>
                  </Col>
                  <Col xs={6}>
                    <div className="d-flex align-items-center gap-2 text-muted mb-1">
                      <DollarSign size={14} /> <span className="small fw-medium">Budget</span>
                    </div>
                    <div className="small fw-bold text-dark">
                      ${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="d-flex align-items-center gap-2 text-muted mb-1">
                      <FileText size={14} /> <span className="small fw-medium">Milestones</span>
                    </div>
                    <div className="small fw-bold text-dark">
                      {project.milestones?.completed || 0} / {project.milestones?.total || 0}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              
              <Card.Footer className="bg-light border-0 px-4 py-3">
                <div className="d-flex justify-content-between text-center">
                  <div>
                    <div className="text-muted small mb-1">Total Tasks</div>
                    <div className="fw-bold">{project.tasks?.total || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted small mb-1">Completed</div>
                    <div className="fw-bold text-success">{project.tasks?.completed || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted small mb-1">In Progress</div>
                    <div className="fw-bold text-primary">{project.tasks?.inProgress || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted small mb-1">Blocked</div>
                    <div className="fw-bold text-danger">{project.tasks?.blocked || 0}</div>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingProject(null); }} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(handleCreateSubmit)}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">Project Name</Form.Label>
                  <Form.Control {...register('name')} isInvalid={!!errors.name} placeholder="e.g. Website Redesign" className="bg-light border-0 py-2.5" />
                  <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">Client Company</Form.Label>
                  <Form.Select {...register('company')} isInvalid={!!errors.company} className="bg-light border-0 py-2.5">
                    <option value="">Select Company</option>
                    {companies.map((c: Company) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.company?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">Budget ($)</Form.Label>
                  <Form.Control type="number" {...register('budget')} isInvalid={!!errors.budget} className="bg-light border-0 py-2.5" />
                  <Form.Control.Feedback type="invalid">{errors.budget?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">Start Date</Form.Label>
                  <Form.Control type="date" {...register('startDate')} isInvalid={!!errors.startDate} className="bg-light border-0 py-2.5" />
                  <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">End Date</Form.Label>
                  <Form.Control type="date" {...register('endDate')} isInvalid={!!errors.endDate} className="bg-light border-0 py-2.5" />
                  <Form.Control.Feedback type="invalid">{errors.endDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">Description</Form.Label>
                  <Form.Control as="textarea" rows={3} {...register('description')} isInvalid={!!errors.description} className="bg-light border-0" placeholder="Project details..." />
                  <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm" disabled={isSaving}>
              {isSaving ? <Spinner size="sm" /> : editingProject ? 'Update Project' : 'Create Project'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
