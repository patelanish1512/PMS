import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, ProgressBar, Spinner, Dropdown, Modal } from 'react-bootstrap';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Search, 
  MoreVertical
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import type { Company } from '../../types/api';
import { toast } from 'sonner';
import { usePermissions } from '../../context/usePermissions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const companySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  industry: z.string().min(1, 'Industry is required').max(50, 'Industry is too long'),
  address: z.string().min(1, 'Address is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const CompaniesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', industry: '', address: '', contactPerson: '', phone: '', email: '' }
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await apiClient.get<Company[]>('/Companies');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Company>) => apiClient.post('/Companies', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
      setEditingCompany(null);
      toast.success('Company created');
    },
    onError: () => toast.error('Failed to save company'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Company> }) => apiClient.put(`/Companies/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
      setEditingCompany(null);
      toast.success('Company updated');
    },
    onError: () => toast.error('Failed to update company'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/Companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
    },
    onError: () => toast.error('Failed to delete company'),
  });

  const filteredCompanies = companies.filter(company => {
    const q = searchQuery.toLowerCase();
    return company.name.toLowerCase().includes(q)
      || company.industry.toLowerCase().includes(q)
      || company.contactPerson.toLowerCase().includes(q);
  });

  const handleSaveCompany = (data: CompanyFormValues) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, payload: data });
      return;
    }

    createMutation.mutate(data);
  };

  const openCreate = () => {
    setEditingCompany(null);
    reset({ name: '', industry: '', address: '', contactPerson: '', phone: '', email: '' });
    setShowModal(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Companies...</p>
      </div>
    );
  }

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Companies & Clients</h1>
          <p className="text-muted mb-0">Manage project associations and client profiles</p>
        </div>
        {can('companies', 'canCreate') && (
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={openCreate}>
          <Plus size={20} /> Add Company
        </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <div className="position-relative">
            <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
            <Form.Control 
              placeholder="Search by company name, industry, or contact..." 
              className="ps-5 bg-light border-0 py-2.5 rounded-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {filteredCompanies.map((company: Company) => (
          <Col key={company.id} lg={6}>
            <Card className="border-0 shadow-sm overflow-hidden h-100 company-card hover-shadow transition-all">
              <Card.Header className="bg-white p-4 border-0 pb-0">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="fw-bold mb-1">{company.name}</h4>
                      <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1 rounded-pill small">
                        {company.industry}
                      </Badge>
                    </div>
                  </div>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                      <MoreVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow-sm border-0">
                      {can('companies', 'canEdit') && <Dropdown.Item onClick={() => { 
                        setEditingCompany(company); 
                        reset({ 
                          name: company.name, 
                          industry: company.industry, 
                          address: company.address, 
                          contactPerson: company.contactPerson, 
                          phone: company.phone, 
                          email: company.email 
                        }); 
                        setShowModal(true); 
                      }}>Edit Company</Dropdown.Item>}
                      {can('companies', 'canDelete') && <Dropdown.Item className="text-danger" onClick={() => deleteMutation.mutate(company.id)}>Delete Company</Dropdown.Item>}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="mb-4 g-3">
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                      <MapPin size={14} className="text-primary" /> {company.address}
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Mail size={14} className="text-primary" /> {company.email}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                      <Phone size={14} className="text-primary" /> {company.phone}
                    </div>
                    <div className="small fw-bold text-dark d-flex align-items-center gap-2">
                      <div className="bg-light px-2 py-0.5 rounded text-secondary" style={{ fontSize: '10px' }}>REP</div>
                      {company.contactPerson}
                    </div>
                  </Col>
                </Row>

                <div className="p-3 bg-light rounded-4">
                  <Row className="g-3 mb-3 text-center">
                    <Col xs={4}>
                      <div className="text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Active</div>
                      <div className="h5 fw-bold mb-0 text-primary">{company.projects?.active || 0}</div>
                    </Col>
                    <Col xs={4}>
                      <div className="text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Done</div>
                      <div className="h5 fw-bold mb-0 text-success">{company.projects?.completed || 0}</div>
                    </Col>
                    <Col xs={4}>
                      <div className="text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Portfolio</div>
                      <div className="h5 fw-bold mb-0 text-dark">${((company.budget || 0) / 1000).toFixed(0)}k</div>
                    </Col>
                  </Row>
                  <div className="px-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-bold text-secondary text-uppercase" style={{ fontSize: '10px' }}>Overall Progress</span>
                      <span className="small fw-bold text-primary">{company.completion || 0}%</span>
                    </div>
                    <ProgressBar now={company.completion || 0} variant="primary" style={{ height: '6px' }} className="rounded-pill shadow-none" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingCompany(null); }} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingCompany ? 'Edit Company' : 'Add Company'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(handleSaveCompany)}>
          <Modal.Body className="p-4">
            <div className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Company Name</Form.Label>
                <Form.Control {...register('name')} isInvalid={!!errors.name} className="bg-light border-0 py-2.5" />
                <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Industry</Form.Label>
                <Form.Control {...register('industry')} isInvalid={!!errors.industry} className="bg-light border-0 py-2.5" />
                <Form.Control.Feedback type="invalid">{errors.industry?.message}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Address</Form.Label>
                <Form.Control {...register('address')} isInvalid={!!errors.address} className="bg-light border-0 py-2.5" />
                <Form.Control.Feedback type="invalid">{errors.address?.message}</Form.Control.Feedback>
              </Form.Group>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-secondary">Contact Person</Form.Label>
                    <Form.Control {...register('contactPerson')} isInvalid={!!errors.contactPerson} className="bg-light border-0 py-2.5" />
                    <Form.Control.Feedback type="invalid">{errors.contactPerson?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-secondary">Phone</Form.Label>
                    <Form.Control {...register('phone')} isInvalid={!!errors.phone} className="bg-light border-0 py-2.5" />
                    <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Email</Form.Label>
                <Form.Control type="email" {...register('email')} isInvalid={!!errors.email} className="bg-light border-0 py-2.5" />
                <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold" disabled={isSaving}>
              {isSaving ? <Spinner size="sm" /> : editingCompany ? 'Update Company' : 'Create Company'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CompaniesPage;
