import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Badge, Table, Spinner } from 'react-bootstrap';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Calendar, 
  Clock, 
  TrendingUp, 
  FolderKanban, 
  Download,
  X
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import type { Project, TimeLog } from '../../types/api';
import { toast } from 'sonner';
import { usePermissions } from '../../context/usePermissions';
import { useTimerStore } from '../../store/useTimerStore';

const TimeTrackingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { 
    isTracking, 
    selectedProjectId, 
    taskDescription, 
    startTimer, 
    pauseTimer, 
    stopTimer, 
    setProject, 
    setTask, 
    getElapsedSeconds 
  } = useTimerStore();

  const [displayTime, setDisplayTime] = useState(getElapsedSeconds());

  // Queries
  const { data: logs = [], isLoading } = useQuery<TimeLog[]>({
    queryKey: ['time-logs'],
    queryFn: async () => {
      const response = await apiClient.get<TimeLog[]>('/TimeLogs');
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

  const createTimeLogMutation = useMutation({
    mutationFn: (payload: {
      projectId: string;
      projectName: string;
      taskName: string;
      description: string;
      logDate: string;
      hoursSpent: number;
      status: string;
    }) => apiClient.post('/TimeLogs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] });
      toast.success('Time log saved');
      stopTimer();
      setDisplayTime(0);
    },
    onError: () => toast.error('Failed to save time log'),
  });

  const deleteTimeLogMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/TimeLogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] });
      toast.success('Time log deleted');
    },
    onError: () => toast.error('Failed to delete time log'),
  });

  // Timer Effect
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setDisplayTime(getElapsedSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, getElapsedSeconds]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <Badge bg="success-subtle" className="text-success border border-success-subtle px-2 py-1 rounded-pill">APPROVED</Badge>;
      case 'rejected': return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-2 py-1 rounded-pill">REJECTED</Badge>;
      default: return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle px-2 py-1 rounded-pill">PENDING</Badge>;
    }
  };

  const exportTimeLogs = () => {
    const header = ['Date', 'Project', 'Task', 'User', 'Hours', 'Status'];
    const rows = logs.map(log => [log.date, log.project, log.task, log.user, log.hours.toString(), log.status]);
    const csv = [header, ...rows]
      .map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `time-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveCurrentSession = (minimumSeconds = 0) => {
    const project = projects.find((item) => item.id === selectedProjectId);
    const secondsToLog = Math.max(displayTime, minimumSeconds);

    if (!project) {
      toast.error('Select a project before saving time');
      return;
    }

    if (!taskDescription.trim()) {
      toast.error('Add a task description before saving time');
      return;
    }

    const hours = Math.max(0.1, Math.round((secondsToLog / 3600) * 10) / 10);
    createTimeLogMutation.mutate({
      projectId: project.id,
      projectName: project.name,
      taskName: taskDescription.trim(),
      description: taskDescription.trim(),
      logDate: new Date().toISOString(),
      hoursSpent: hours,
      status: 'pending',
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Time Logs...</p>
      </div>
    );
  }

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Time Tracking</h1>
          <p className="text-muted mb-0">Log and monitor work hours across projects</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" className="d-flex align-items-center gap-2 px-3 fw-bold shadow-sm" onClick={exportTimeLogs}>
            <Download size={18} /> Export
          </Button>
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 fw-bold shadow-sm" onClick={() => saveCurrentSession(3600)} disabled={!can('timelogs', 'canCreate') || createTimeLogMutation.isPending}>
            <Plus size={20} /> Log Time
          </Button>
        </div>
      </div>

      {/* Timer Widget */}
      <Card className="border-0 shadow-sm time-session-card overflow-hidden mb-4 rounded-4">
        <Card.Body className="p-5 position-relative">
          <div className="position-absolute top-0 end-0 p-5 opacity-10">
            <Clock size={160} />
          </div>
          <Row className="align-items-center position-relative">
            <Col lg={7}>
              <div className="text-uppercase fw-bold mb-2 opacity-75" style={{ fontSize: '12px', letterSpacing: '1px' }}>Current Session</div>
              <h2 className="display-1 fw-bold mb-4 font-monospace">{formatTime(displayTime)}</h2>
              <div className="d-flex gap-3">
                {!isTracking ? (
                  <Button variant="primary" className="px-5 py-3 rounded-4 fw-bold d-flex align-items-center gap-2" onClick={startTimer}>
                    <Play size={20} fill="currentColor" /> Start Timer
                  </Button>
                ) : (
                  <>
                    <Button variant="primary" className="px-5 py-3 rounded-4 fw-bold d-flex align-items-center gap-2" onClick={pauseTimer}>
                      <Pause size={20} fill="currentColor" /> Pause
                    </Button>
                    <Button variant="outline-primary" className="px-5 py-3 rounded-4 fw-bold d-flex align-items-center gap-2 border-2" onClick={() => saveCurrentSession()} disabled={createTimeLogMutation.isPending}>
                      <Square size={20} fill="currentColor" /> Stop & Save
                    </Button>
                  </>
                )}
              </div>
            </Col>
            <Col lg={5} className="mt-4 mt-lg-0">
              <div className="bg-white p-4 rounded-4 text-dark shadow-sm">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-secondary">Select Project</Form.Label>
                  <Form.Select className="bg-light border-0 py-2.5" value={selectedProjectId} onChange={(event) => setProject(event.target.value)}>
                    <option value="">Choose Project...</option>
                    {projects.map((p: Project) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-bold text-secondary">Task Description</Form.Label>
                  <Form.Control value={taskDescription} onChange={(event) => setTask(event.target.value)} placeholder="What are you working on?" className="bg-light border-0 py-2.5" />
                </Form.Group>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Summary */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-primary-subtle p-2 rounded-3 text-primary"><Clock size={20} /></div>
                <span className="text-muted small fw-bold">Today's Total</span>
              </div>
              <h3 className="fw-bold mb-1">6.5 hrs</h3>
              <div className="text-muted small">Target: 8.0 hrs</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-success-subtle p-2 rounded-3 text-success"><Calendar size={20} /></div>
                <span className="text-muted small fw-bold">This Week</span>
              </div>
              <h3 className="fw-bold mb-1">32.2 hrs</h3>
              <div className="text-success small fw-bold">+4% vs last week</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-info-subtle p-2 rounded-3 text-info"><FolderKanban size={20} /></div>
                <span className="text-muted small fw-bold">Active Projects</span>
              </div>
              <h3 className="fw-bold mb-1">4</h3>
              <div className="text-muted small">Across 2 clients</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-warning-subtle p-2 rounded-3 text-warning"><TrendingUp size={20} /></div>
                <span className="text-muted small fw-bold">Efficiency</span>
              </div>
              <h3 className="fw-bold mb-1">94%</h3>
              <div className="text-muted small">Billed vs Available</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Time Entries Table */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white py-4 px-4 border-0">
          <h5 className="fw-bold mb-0">Recent Time Entries</h5>
        </Card.Header>
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-secondary small fw-bold border-0">DATE</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0">PROJECT</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0">TASK</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0">USER</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0 text-center">HOURS</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0 text-center">STATUS</th>
              <th className="py-3 px-4 text-secondary small fw-bold border-0 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="border-0">
            {logs.map((log: TimeLog) => (
              <tr key={log.id} className="align-middle border-bottom">
                <td className="py-3 px-4 text-muted small">{log.date}</td>
                <td className="py-3 px-4 fw-bold text-dark">{log.project}</td>
                <td className="py-3 px-4 text-muted small">{log.task}</td>
                <td className="py-3 px-4 fw-medium text-dark">{log.user}</td>
                <td className="py-3 px-4 fw-bold text-dark text-center">{log.hours.toFixed(1)}</td>
                <td className="py-3 px-4 text-center">{getStatusBadge(log.status)}</td>
                <td className="py-3 px-4 text-end">
                  {can('timelogs', 'canDelete') && (
                    <Button variant="link" className="text-muted p-1" onClick={() => deleteTimeLogMutation.mutate(log.id)} disabled={deleteTimeLogMutation.isPending}><X size={16} /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {logs.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted italic mb-0">No time entries found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TimeTrackingPage;
