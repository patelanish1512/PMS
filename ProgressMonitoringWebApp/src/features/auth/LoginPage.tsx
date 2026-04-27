import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Building2, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, BarChart3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../api/apiClient';
import type { AuthResponse } from '../../types/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/Auth/login', data);
      const { token, userId, fullName, email, role } = response.data;
      setAuth({ id: userId, fullName, email, role }, token);
      navigate('/');
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAccess = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password@123');
  };

  return (
    <div className="min-h-screen login-page d-flex align-items-center justify-content-center p-4">
      <Container className="login-shell">
        <Card className="border-0 login-card overflow-hidden">
          <Row className="g-0 login-panel">
            <Col lg={5} className="d-none d-lg-block p-3">
              <div className="login-intro d-flex flex-column justify-content-between">
                <div>
                  <div className="app-brand-mark mb-4">
                    <Building2 size={20} />
                  </div>
                  <h1 className="display-6 fw-bold mb-3">Project Monitor</h1>
                  <p className="mb-4 opacity-75">Real-time progress workspace</p>
                  <div className="d-grid gap-3">
                    <div className="d-flex gap-3 align-items-start">
                      <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-1" />
                      <div>
                        <div className="fw-bold">24 active projects</div>
                        <div className="small opacity-75">Updated portfolio status</div>
                      </div>
                    </div>
                    <div className="d-flex gap-3 align-items-start">
                      <ShieldCheck size={20} className="text-info flex-shrink-0 mt-1" />
                      <div>
                        <div className="fw-bold">11 permission modules</div>
                        <div className="small opacity-75">Role access matrix</div>
                      </div>
                    </div>
                    <div className="d-flex gap-3 align-items-start">
                      <BarChart3 size={20} className="text-warning flex-shrink-0 mt-1" />
                      <div>
                        <div className="fw-bold">96% reporting uptime</div>
                        <div className="small opacity-75">Operational visibility</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="small opacity-75">Progress Monitoring System · 2026</div>
              </div>
            </Col>

            <Col lg={7} className="d-flex align-items-center">
              <Card.Body className="p-4 p-md-5">
                <div className="d-lg-none text-center mb-4">
                  <div className="app-brand-mark mx-auto mb-3">
                    <Building2 size={20} />
                  </div>
                  <h1 className="h3 fw-bold mb-1">Project Monitor</h1>
                  <p className="text-muted mb-0">Real-time progress tracking system</p>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h2 className="h4 fw-bold mb-1">Welcome back</h2>
                    <p className="text-muted mb-0 small">Sign in to continue to your workspace.</p>
                  </div>
                  <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    System Online
                  </span>
                </div>

                {error && (
                  <Alert variant="danger" className="d-flex align-items-center gap-2 border-0 rounded-3">
                    <AlertCircle size={18} />
                    <span className="small">{error}</span>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
                    <div className="position-relative">
                      <Mail className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
                      <Form.Control
                        {...register('email')}
                        type="email"
                        placeholder="admin@example.com"
                        className={`ps-5 py-2.5 bg-light border-0 rounded-3 ${errors.email ? 'is-invalid' : ''}`}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                    </div>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
                    <div className="position-relative">
                      <Lock className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
                      <Form.Control
                        {...register('password')}
                        type="password"
                        placeholder="********"
                        className={`ps-5 py-2.5 bg-light border-0 rounded-3 ${errors.password ? 'is-invalid' : ''}`}
                      />
                      {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                    </div>
                  </Form.Group>

                  <div className="d-flex align-items-center justify-content-between my-2">
                    <Form.Check type="checkbox" label={<span className="small text-secondary">Remember me</span>} />
                    <a href="#" className="small text-primary text-decoration-none fw-semibold">Forgot password?</a>
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={isLoading}
                    className="py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  >
                    {isLoading ? <Spinner size="sm" /> : <>Continue <ArrowRight size={18} /></>}
                  </Button>
                </Form>

                {/* Quick Access */}
                <div className="mt-5">
                  <p className="text-uppercase text-muted fw-bold text-center mb-3" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Quick Access (Demo)
                  </p>
                  <Row className="g-2">
                    {[
                      { label: 'Admin', email: 'admin@example.com', color: 'danger' },
                      { label: 'Manager', email: 'manager@example.com', color: 'warning' },
                      { label: 'Member', email: 'member@example.com', color: 'primary' },
                      { label: 'Client', email: 'client@example.com', color: 'success' },
                    ].map((btn) => (
                      <Col xs={6} key={btn.label}>
                        <Button 
                          variant={`outline-${btn.color}`} 
                          size="sm" 
                          className="w-100 py-2 border-2 fw-semibold quick-access-button"
                          style={{ fontSize: '11px' }}
                          onClick={() => quickAccess(btn.email)}
                        >
                          {btn.label}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>

                <div className="mt-4 pt-4 border-top text-center">
                  <p className="small text-muted mb-0">
                    Don't have an account? <a href="#" className="text-primary fw-bold text-decoration-none">Contact Admin</a>
                  </p>
                </div>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </Container>
    </div>
  );
};

export default LoginPage;
