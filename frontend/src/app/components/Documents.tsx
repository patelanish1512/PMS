import { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../../services/documentService';
import { getProjects } from '../../services/projectService';
import {
  Upload,
  Search,
  FileText,
  File,
  Download,
  Eye,
  Trash2,
  FolderKanban,
  Calendar,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [docs, setDocs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');

  // Upload Form State
  const [formData, setFormData] = useState({
    projectId: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
      const [docData, projectData] = await Promise.all([
        currentUser.role === 'Client' ? import('../../services/documentService').then(m => m.getClientDocuments()) : getDocuments(),
        currentUser.role === 'Client' ? import('../../services/projectService').then(m => m.getClientProjects()) : getProjects()
      ]);
      setDocs(docData);
      setProjects(projectData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { alert('Please select a file.'); return; }
    setIsUploading(true);
    try {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      await uploadDocument(
        selectedFile,
        formData.projectId,
        selectedProject?.name || 'Unknown'
      );
      setShowModal(false);
      setFormData({ projectId: '', description: '' });
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getFileIcon = (type: string) => {
    const iconClass = "w-8 h-8";
    const t = type.toLowerCase();
    if (t === 'pdf') return <FileText className={`${iconClass} text-red-600`} />;
    if (['docx', 'doc'].includes(t)) return <FileText className={`${iconClass} text-blue-600`} />;
    if (['xlsx', 'xls', 'csv'].includes(t)) return <FileText className={`${iconClass} text-green-600`} />;
    if (['png', 'jpg', 'jpeg', 'svg'].includes(t)) return <File className={`${iconClass} text-purple-600`} />;
    if (t === 'zip' || t === 'rar') return <File className={`${iconClass} text-orange-600`} />;
    return <File className={`${iconClass} text-gray-600`} />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'design': return 'bg-purple-100 text-purple-700';
      case 'technical': return 'bg-green-100 text-green-700';
      case 'legal': return 'bg-red-100 text-red-700';
      case 'financial': return 'bg-orange-100 text-orange-700';
      case 'progress': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.category === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalSizeMB = docs.reduce((acc, doc) => {
    const sizeStr = doc.size.split(' ')[0];
    const unit = doc.size.includes('MB') ? 1 : 0.001;
    return acc + (parseFloat(sizeStr) * unit);
  }, 0);

  const canUploadDocuments = currentUser.role !== 'Client';

  if (isLoading && docs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
          <p className="text-gray-600">Manage project documents and attachments</p>
        </div>
        {canUploadDocuments && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Documents</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{docs.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Storage Used</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalSizeMB.toFixed(1)} MB</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderKanban className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Projects with Docs</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {new Set(docs.map(d => d.project)).size}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Cloud Status</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 text-green-500">Active</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by name or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-6 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer font-medium text-gray-700 min-w-[180px]"
          >
            <option value="all">All Categories</option>
            <option value="planning">Planning</option>
            <option value="design">Design</option>
            <option value="technical">Technical</option>
            <option value="legal">Legal</option>
            <option value="financial">Financial</option>
            <option value="progress">Progress</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Document Name</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Project</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Uploader</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Size</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="font-bold text-gray-900">{doc.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                    {doc.project}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-tight ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                        {doc.uploadedBy.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{doc.uploadedBy}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                    {new Date(doc.uploadedDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900 font-bold text-right">
                    {doc.size}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="View">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-orange-500" />
                      </button>
                      <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Download">
                        <Download className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                      </button>
                      {(currentUser.role === 'Admin' || currentUser.role === 'ProjectManager') && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-400 italic font-medium">
                    No documents found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Upload Document</h3>
                <p className="text-sm text-gray-500 font-medium">Add a new file to your project</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {selectedFile && <p className="text-xs text-gray-500 mt-1">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Project</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium appearance-none"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none h-32 resize-none font-medium"
                  placeholder="Briefly describe the contents of this document..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-10 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-orange-100 disabled:opacity-50 flex items-center gap-2 active:scale-95"
                >
                  {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
