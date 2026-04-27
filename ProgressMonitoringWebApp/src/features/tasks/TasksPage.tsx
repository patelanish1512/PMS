import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, Dropdown, Spinner, Modal } from 'react-bootstrap';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import type { Project, TaskBoard, TaskItem } from '../../types/api';
import { toast } from 'sonner';
import { usePermissions } from '../../context/usePermissions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const taskSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.coerce.number().min(1).max(3),
  endDate: z.string().min(1, 'Due date is required'),
  assigneeName: z.string().optional(),
});

type TaskFormInput = z.input<typeof taskSchema>;
type TaskFormValues = z.output<typeof taskSchema>;

const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormInput, unknown, TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { projectId: '', title: '', description: '', priority: 2, endDate: '', assigneeName: '' }
  });

  const { data: board = { todo: [], 'in-progress': [], blocked: [], done: [] }, isLoading } = useQuery<TaskBoard>({
    queryKey: ['tasks-board'],
    queryFn: async () => {
      const response = await apiClient.get<TaskBoard>('/Tasks/board');
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

  const createTaskMutation = useMutation({
    mutationFn: (payload: {
      projectId: string;
      projectName: string;
      title: string;
      description: string;
      status: number;
      priority: number;
      startDate: string;
      endDate: string;
      assigneeNames: string[];
    }) => apiClient.post('/Tasks', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-board'] });
      setShowModal(false);
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.patch(`/Tasks/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-board'] });
      toast.success('Task status updated');
    },
    onError: () => toast.error('Failed to update task status'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/Tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-board'] });
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const columns: Array<{ id: keyof TaskBoard; title: string; color: string; icon: typeof Clock }> = [
    { id: 'todo', title: 'To Do', color: 'secondary', icon: Clock },
    { id: 'in-progress', title: 'In Progress', color: 'primary', icon: AlertCircle },
    { id: 'blocked', title: 'Blocked', color: 'danger', icon: AlertCircle },
    { id: 'done', title: 'Done', color: 'success', icon: CheckCircle2 },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-2">HIGH</Badge>;
      case 'medium': return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle px-2">MEDIUM</Badge>;
      default: return <Badge bg="info-subtle" className="text-info border border-info-subtle px-2">LOW</Badge>;
    }
  };

  const handleCreateTask = (data: TaskFormValues) => {
    const project = projects.find(item => item.id === data.projectId);

    if (!project) {
      toast.error('Select a project');
      return;
    }

    createTaskMutation.mutate({
      projectId: project.id,
      projectName: project.name,
      title: data.title,
      description: data.description || '',
      status: 0,
      priority: data.priority,
      startDate: new Date().toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      assigneeNames: data.assigneeName?.trim() ? [data.assigneeName.trim()] : [],
    });
  };

  const openCreateModal = () => {
    reset({ projectId: '', title: '', description: '', priority: 2, endDate: '', assigneeName: '' });
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Task Board...</p>
      </div>
    );
  }

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Task Board</h1>
          <p className="text-muted mb-0">Collaborate and track progress in real-time</p>
        </div>
        {can('tasks', 'canCreate') && (
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={openCreateModal}>
          <Plus size={20} /> Add Task
        </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <div className="position-relative">
            <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
            <Form.Control 
              placeholder="Search tasks by title or project..." 
              className="ps-5 bg-light border-0 py-2.5 rounded-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4 flex-nowrap overflow-auto pb-3">
        {columns.map((col) => {
          const colTasks = board[col.id] || [];
          const filteredTasks = colTasks.filter((t: TaskItem) => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.project.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <Col key={col.id} style={{ minWidth: '320px', maxWidth: '320px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg={col.color} className="rounded-circle p-1" style={{ width: '8px', height: '8px' }}> </Badge>
                  <h6 className="fw-bold mb-0">{col.title}</h6>
                  <Badge bg="white" className="text-muted border rounded-pill px-2">{filteredTasks.length}</Badge>
                </div>
                {can('tasks', 'canCreate') && <Button variant="link" className="p-0 text-muted" onClick={openCreateModal}><Plus size={18} /></Button>}
              </div>

              <div className="d-flex flex-column gap-3">
                {filteredTasks.map((task: TaskItem) => (
                  <Card key={task.id} className="border-0 shadow-sm task-card hover-shadow transition-all cursor-pointer">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="text-uppercase text-primary fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                            {task.project}
                          </div>
                          <h6 className="fw-bold mb-2 text-dark line-clamp-2">{task.title}</h6>
                        </div>
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret">
                            <MoreVertical size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0">
                            {can('tasks', 'canEdit') && columns.filter(item => item.id !== col.id).map(item => (
                              <Dropdown.Item key={item.id} onClick={() => updateStatusMutation.mutate({ id: task.id, status: item.id })}>
                                Move to {item.title}
                              </Dropdown.Item>
                            ))}
                            <Dropdown.Divider />
                            {can('tasks', 'canDelete') && <Dropdown.Item className="text-danger" onClick={() => deleteTaskMutation.mutate(task.id)}>Delete</Dropdown.Item>}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>

                      <div className="mb-3">
                        {getPriorityBadge(task.priority)}
                      </div>

                      <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                            {task.assignees?.[0]?.[0] || 'U'}
                          </div>
                          <span className="small text-muted fw-medium">{task.assignees?.[0] || 'Unassigned'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 text-muted small fw-medium">
                          <Calendar size={12} />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-5 rounded-3 border-2 border-dashed bg-white-50">
                    <p className="text-muted small mb-0 italic">No tasks found</p>
                  </div>
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Create Task</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(handleCreateTask)}>
          <Modal.Body className="p-4">
            <div className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Project</Form.Label>
                <Form.Select {...register('projectId')} isInvalid={!!errors.projectId} className="bg-light border-0 py-2.5">
                  <option value="">Select project</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.projectId?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Title</Form.Label>
                <Form.Control {...register('title')} isInvalid={!!errors.title} className="bg-light border-0 py-2.5" />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Description</Form.Label>
                <Form.Control as="textarea" rows={3} {...register('description')} isInvalid={!!errors.description} className="bg-light border-0" />
                <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
              </Form.Group>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-secondary">Priority</Form.Label>
                    <Form.Select {...register('priority')} isInvalid={!!errors.priority} className="bg-light border-0 py-2.5">
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.priority?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-secondary">Due Date</Form.Label>
                    <Form.Control type="date" {...register('endDate')} isInvalid={!!errors.endDate} className="bg-light border-0 py-2.5" />
                    <Form.Control.Feedback type="invalid">{errors.endDate?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Assignee Name</Form.Label>
                <Form.Control {...register('assigneeName')} isInvalid={!!errors.assigneeName} placeholder="Optional" className="bg-light border-0 py-2.5" />
                <Form.Control.Feedback type="invalid">{errors.assigneeName?.message}</Form.Control.Feedback>
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? <Spinner size="sm" /> : 'Create Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksPage;
