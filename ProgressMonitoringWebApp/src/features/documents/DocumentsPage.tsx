import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Spinner, Modal } from 'react-bootstrap';
import { 
  Upload, 
  Search, 
  FileText, 
  Trash2,
  FolderKanban,
  CheckCircle2
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import type { DocumentItem, Project } from '../../types/api';
import { toast } from 'sonner';
import { usePermissions } from '../../context/usePermissions';

const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: docs = [], isLoading } = useQuery<DocumentItem[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await apiClient.get<DocumentItem[]>('/Documents');
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

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.post('/Attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadModal(false);
      toast.success('Document uploaded');
    },
    onError: () => toast.error('Failed to upload document'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/Attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Documents...</p>
      </div>
    );
  }

  const filteredDocs = docs.filter((doc: DocumentItem) => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const project = projects.find(item => item.id === data.get('projectId'));

    if (!project) {
      toast.error('Select a project');
      return;
    }

    data.set('projectName', project.name);
    data.set('taskId', '');
    data.set('taskName', '');
    data.set('category', 'general');
    uploadMutation.mutate(data);
  };

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Documents</h1>
          <p className="text-muted mb-0">Centralized project document management</p>
        </div>
        {can('documents', 'canCreate') && (
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={() => setShowUploadModal(true)}>
          <Upload size={20} /> Upload File
        </Button>
        )}
      </div>

      {/* Stats Summary */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-primary-subtle p-2 rounded-3 text-primary"><FileText size={20} /></div>
                <span className="text-muted small fw-bold">Total Files</span>
              </div>
              <h3 className="fw-bold mb-1">{docs.length}</h3>
              <div className="text-muted small">All active documents</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-success-subtle p-2 rounded-3 text-success"><CheckCircle2 size={20} /></div>
                <span className="text-muted small fw-bold">Verified</span>
              </div>
              <h3 className="fw-bold mb-1">{docs.length}</h3>
              <div className="text-muted small">Status: Clean</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div className="w-100 me-4">
                <div className="text-muted small fw-bold text-uppercase mb-2">Storage Usage</div>
                <div className="d-flex justify-content-between mb-1 small fw-bold">
                  <span>2.4 GB used</span>
                  <span>10 GB total</span>
                </div>
                <div className="bg-light rounded-pill p-1" style={{ height: '12px' }}>
                  <div className="bg-primary rounded-pill h-100" style={{ width: '24%' }}></div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-4">
          <div className="position-relative mb-4">
            <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={18} />
            <Form.Control 
              placeholder="Search by filename or project..." 
              className="ps-5 bg-light border-0 py-2.5 rounded-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Table responsive hover className="mb-0 align-middle">
            <thead>
              <tr className="bg-light border-0">
                <th className="py-3 px-4 text-secondary small fw-bold border-0">DOCUMENT NAME</th>
                <th className="py-3 px-4 text-secondary small fw-bold border-0">PROJECT</th>
                <th className="py-3 px-4 text-secondary small fw-bold border-0">UPLOADER</th>
                <th className="py-3 px-4 text-secondary small fw-bold border-0">DATE</th>
                <th className="py-3 px-4 text-secondary small fw-bold border-0 text-center">SIZE</th>
                <th className="py-3 px-4 text-secondary small fw-bold border-0 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {filteredDocs.map((doc: DocumentItem) => (

                <tr key={doc.id} className="border-bottom">
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-danger">
                        <FileText size={20} />
                      </div>
                      <span className="fw-bold text-dark">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <FolderKanban size={14} /> {doc.project}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                        {doc.uploadedBy?.[0] || 'U'}
                      </div>
                      <span className="small fw-medium">{doc.uploadedBy}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted small">{doc.uploadedDate}</td>
                  <td className="py-3 px-4 text-dark small fw-bold text-center">{doc.size}</td>
                  <td className="py-3 px-4 text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      {can('documents', 'canDelete') && <Button variant="link" className="p-1 text-muted hover-danger" onClick={() => deleteMutation.mutate(doc.id)} disabled={deleteMutation.isPending}><Trash2 size={16} /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {docs.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted italic mb-0">No documents found</p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Upload Document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body className="p-4">
            <div className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">Project</Form.Label>
                <Form.Select name="projectId" required className="bg-light border-0 py-2.5">
                  <option value="">Select project</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </Form.Select>
              </Form.Group>
              <input type="hidden" name="projectName" />
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">File</Form.Label>
                <Form.Control name="file" type="file" required className="bg-light border-0 py-2.5" />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Spinner size="sm" /> : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
