import React from 'react';
import { Row, Col, Card, ProgressBar, Table, Badge, Spinner } from 'react-bootstrap';
import { 
  TrendingUp, 
  TrendingDown, 
  FolderKanban, 
  CheckCircle2, 
  AlertCircle, 
  Users,
  Calendar,
  Target
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import type {
  DashboardData,
  DashboardMetric,
  ProjectHealthDatum,
  RecentProject,
  UpcomingMilestone,
} from '../../types/api';

const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardData>('/Dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="text-muted fw-medium">Loading Real-Time Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <AlertCircle size={48} className="text-danger mb-3" />
        <h3 className="h5">Failed to load dashboard</h3>
        <p className="text-muted">Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  const metrics = data?.metrics ?? [];
  const projectHealthData = data?.projectHealthData ?? [];
  const completionTrendData = data?.completionTrendData ?? [];
  const taskStatusData = data?.taskStatusData ?? [];
  const recentProjects = data?.recentProjects ?? [];
  const upcomingMilestones = data?.upcomingMilestones ?? [];

  const getMetricIcon = (label: string) => {
    switch (label) {
      case 'Active Projects': return FolderKanban;
      case 'Tasks Completed': return CheckCircle2;
      case 'Overdue Items': return AlertCircle;
      default: return Users;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'on-track': return <Badge bg="success-subtle" className="text-success border border-success-subtle px-3 py-1 rounded-pill">On Track</Badge>;
      case 'at-risk': return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle px-3 py-1 rounded-pill">At Risk</Badge>;
      case 'delayed': return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-3 py-1 rounded-pill">Delayed</Badge>;
      default: return <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle px-3 py-1 rounded-pill">{health}</Badge>;
    }
  };

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Executive Dashboard</h1>
          <p className="text-muted mb-0">Project portfolio status and performance metrics</p>
        </div>
        <div className="d-flex gap-2">
          <Badge bg="white" className="text-dark border p-2 d-flex align-items-center gap-2">
            <Calendar size={14} /> Last 30 Days
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <Row className="g-4 mb-4">
        {metrics.map((metric: DashboardMetric, index: number) => {
          const Icon = getMetricIcon(metric.label);
          const isPositive = metric.trend === 'up';
          return (
            <Col key={index} sm={6} lg={3}>
              <Card className="stat-card border-0 shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="small text-muted mb-1 fw-medium">{metric.label}</p>
                    <h3 className="fw-bold mb-2">{metric.value}</h3>
                    <div className="d-flex align-items-center gap-1">
                      {isPositive ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-danger" />}
                      <span className={`small fw-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {metric.change}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-3 bg-${metric.color}-subtle text-${metric.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Charts Row 1 */}
      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 p-4">
            <h5 className="fw-bold mb-4">Project Health</h5>
            <div style={{ height: '240px', minWidth: 1, minHeight: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectHealthData.map((entry: ProjectHealthDatum, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100 p-4">
            <h5 className="fw-bold mb-4">Project Completion Trend</h5>
            <div style={{ height: '240px', minWidth: 1, minHeight: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} name="Completed" />
                  <Line type="monotone" dataKey="planned" stroke="#cbd5e1" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Planned" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Tasks & Recent Projects */}
      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 p-4">
            <h5 className="fw-bold mb-4">Task Distribution</h5>
            <div style={{ height: '280px', minWidth: 1, minHeight: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h5 className="fw-bold mb-0">Recent Projects</h5>
              <Badge bg="success-subtle" className="text-success border border-success-subtle px-3 py-1">Live</Badge>
            </div>
            <div className="table-responsive">
              <Table borderless hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th className="text-muted fw-bold small">PROJECT</th>
                    <th className="text-muted fw-bold small">STATUS</th>
                    <th className="text-muted fw-bold small">PROGRESS</th>
                    <th className="text-muted fw-bold small">TEAM</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project: RecentProject, index: number) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-bold text-dark">{project.name}</div>
                        <div className="text-muted small">{project.company}</div>
                      </td>
                      <td>{getHealthBadge(project.status)}</td>
                      <td style={{ width: '180px' }}>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar 
                            now={project.progress} 
                            variant={project.status === 'on-track' ? 'success' : project.status === 'at-risk' ? 'warning' : 'danger'}
                            style={{ height: '6px', flex: 1 }}
                          />
                          <span className="small fw-bold text-dark">{project.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Users size={14} className="text-muted" />
                          <span className="small text-muted">{project.team}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Milestones Section */}
      <div className="mt-4">
        <h5 className="fw-bold mb-3">Upcoming Milestones</h5>
        <Row className="g-3">
          {upcomingMilestones.map((item: UpcomingMilestone, index: number) => (
            <Col key={index} md={4}>
              <Card className="border-0 shadow-sm p-3 h-100 hover-shadow transition-all">
                <div className="d-flex gap-3 align-items-start">
                  <div className={`p-2 rounded-3 bg-${item.status === 'due-soon' ? 'danger' : item.status === 'at-risk' ? 'warning' : 'primary'}-subtle`}>
                    <Target size={20} className={`text-${item.status === 'due-soon' ? 'danger' : item.status === 'at-risk' ? 'warning' : 'primary'}`} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 small">{item.milestone}</h6>
                    <p className="text-muted small mb-2">{item.project}</p>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Calendar size={12} />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default DashboardPage;
