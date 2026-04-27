import React from 'react';
import { Row, Col, Card, Button, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Download, 
  FileText,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportsPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['report-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/Reports/summary');
      return response.data;
    },
  });

  const totalProjects = stats?.totalProjects ?? stats?.TotalProjects ?? 0;
  const activeProjects = stats?.activeProjects ?? stats?.ActiveProjects ?? 0;
  const totalTasks = stats?.totalTasks ?? stats?.TotalTasks ?? 0;
  const completedTasks = stats?.completedTasks ?? stats?.CompletedTasks ?? 0;
  const overallProgress = stats?.overallProgress ?? stats?.OverallProgress ?? 0;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);

  const chartData = [
    { name: 'Projects', value: totalProjects },
    { name: 'Active', value: activeProjects },
    { name: 'Tasks', value: totalTasks },
    { name: 'Done', value: completedTasks },
  ];

  const exportReport = async () => {
    const response = await apiClient.get('/Reports/all');
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `progress-report-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Generating Reports...</p>
      </div>
    );
  }

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">System Reports</h1>
          <p className="text-muted mb-0">Advanced analytics and organizational performance</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 fw-bold shadow-sm" onClick={exportReport}>
            <Download size={20} /> Export Report
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-primary-subtle p-2 rounded-3 text-primary"><TrendingUp size={20} /></div>
                <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill">{overallProgress}%</Badge>
              </div>
              <h3 className="fw-bold mb-1">{overallProgress}%</h3>
              <div className="text-muted small">Overall Completion</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-warning-subtle p-2 rounded-3 text-warning"><Clock size={20} /></div>
                <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill">High</Badge>
              </div>
              <h3 className="fw-bold mb-1">{activeProjects}</h3>
              <div className="text-muted small">Active Projects</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-info-subtle p-2 rounded-3 text-info"><Users size={20} /></div>
                <Badge bg="primary-subtle" className="text-primary border border-primary-subtle rounded-pill">Active</Badge>
              </div>
              <h3 className="fw-bold mb-1">{totalTasks}</h3>
              <div className="text-muted small">Tracked Tasks</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-success-subtle p-2 rounded-3 text-success"><FileText size={20} /></div>
                <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill">New</Badge>
              </div>
              <h3 className="fw-bold mb-1">{completedTasks}</h3>
              <div className="text-muted small">Completed Tasks</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-white p-4 border-0 pb-0">
              <h5 className="fw-bold mb-0">Project Success Trend</h5>
            </Card.Header>
            <Card.Body className="p-4" style={{ height: '350px', minWidth: 1, minHeight: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="value" fill="var(--bs-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm rounded-4">
            <Card.Header className="bg-white p-4 border-0 pb-0">
              <h5 className="fw-bold mb-0">Resource Allocation</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1 small fw-bold">
                  <span>Development</span>
                  <span>75%</span>
                </div>
                <ProgressBar now={75} variant="primary" style={{ height: '8px' }} className="rounded-pill" />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1 small fw-bold">
                  <span>Design & UI/UX</span>
                  <span>45%</span>
                </div>
                <ProgressBar now={45} variant="info" style={{ height: '8px' }} className="rounded-pill" />
              </div>
              <div className="mb-0">
                <div className="d-flex justify-content-between mb-1 small fw-bold">
                  <span>Management</span>
                  <span>30%</span>
                </div>
                <ProgressBar now={30} variant="warning" style={{ height: '8px' }} className="rounded-pill" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white p-4 border-0 pb-0">
              <h5 className="fw-bold mb-0">Key Metrics</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-4">
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white p-2 rounded-3 shadow-sm text-primary"><TrendingUp size={18} /></div>
                    <div>
                      <div className="small fw-bold text-dark">Success Rate</div>
                      <div className="text-muted small">Target exceeded</div>
                    </div>
                  </div>
                  <div className="fw-bold text-success">98%</div>
                </div>
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white p-2 rounded-3 shadow-sm text-warning"><Clock size={18} /></div>
                    <div>
                      <div className="small fw-bold text-dark">Response Time</div>
                      <div className="text-muted small">Global average</div>
                    </div>
                  </div>
                  <div className="fw-bold text-dark">1.2s</div>
                </div>
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white p-2 rounded-3 shadow-sm text-danger"><TrendingDown size={18} /></div>
                    <div>
                      <div className="small fw-bold text-dark">Churn Rate</div>
                      <div className="text-muted small">Decreased</div>
                    </div>
                  </div>
                  <div className="fw-bold text-danger">{pendingTasks}</div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <PieChart size={64} className="text-muted opacity-25 mb-3" />
                <h6 className="fw-bold">Monthly Summary</h6>
                <p className="text-muted small mb-4">You have achieved 92% of your monthly targets. Keep up the great work!</p>
                <Button variant="outline-primary" className="w-100 rounded-pill fw-bold" onClick={exportReport}>Export Detailed Report</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsPage;
