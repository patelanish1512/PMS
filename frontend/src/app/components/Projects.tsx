import { useState, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../../services/projectService';
import { getCompanies } from '../../services/companyService';
import {
  Search,
  Plus,
  MoreVertical,
  Building2,
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Loader2
} from 'lucide-react';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAdmin = currentUser.role === 'Admin';
  const isPM = currentUser.role === 'ProjectManager';
  const canManageProjects = isAdmin || isPM;


  // New Project Form State
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    description: '',
    budget: 0,
    startDate: '',
    endDate: '',
    status: 'active',
    health: 'on-track',
    priority: 'medium'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let pPromise;
      if (currentUser.role === 'Member') pPromise = import('../../services/projectService').then(m => m.getAssignedProjects());
      else if (currentUser.role === 'Client') pPromise = import('../../services/projectService').then(m => m.getClientProjects());
      else pPromise = getProjects();

      const [projectData, companyData] = await Promise.all([
        pPromise,
        getCompanies()
      ]);
      setProjects(projectData);
      setCompanies(companyData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      const payload = {
        name: formData.name,
        description: formData.description,
        company: selectedCompany?.name || '',
        status: formData.status,
        health: formData.health,
        progress: 0,
        budget: formData.budget,
        spent: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        team: 1,
        tasks: { total: 0, completed: 0, inProgress: 0, blocked: 0 },
        milestones: { total: 0, completed: 0 }
      };

      await createProject(payload);
      setShowModal(false);
      setFormData({
        name: '',
        companyId: '',
        description: '',
        budget: 0,
        startDate: '',
        endDate: '',
        status: 'active',
        health: 'on-track',
        priority: 'medium'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please check if all fields are filled.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      companyId: '',
      description: project.description || '',
      budget: project.budget || 0,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status || 'active',
      health: project.health || 'on-track',
      priority: 'medium'
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all related tasks, milestones, and time logs.')) return;
    try {
      await deleteProject(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
    setActiveMenu(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsCreating(true);
    try {
      await updateProject(editingProject.id, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        health: formData.health,
        budget: formData.budget,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      setShowModal(false);
      setEditingProject(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'on-track': return 'bg-green-100 text-green-700 border-green-200';
      case 'at-risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'delayed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'on-track': return <CheckCircle2 className="w-4 h-4" />;
      case 'at-risk': return <AlertCircle className="w-4 h-4" />;
      case 'delayed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'planned': return 'bg-purple-100 text-purple-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (isLoading && projects.length === 0) {
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
          <h2 className="text-2xl font-semibold text-gray-900">Projects</h2>
          <p className="text-gray-600">Manage and monitor all your projects</p>
        </div>
        {canManageProjects && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Project Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">{project.company}</span>
                  </div>
                </div>
                {canManageProjects && (
                <div className="relative">
                  <button onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {activeMenu === project.id && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 w-40">
                      <button onClick={() => handleEdit(project)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700">Edit Project</button>
                      <button onClick={() => handleDelete(project.id)} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600">Delete Project</button>
                    </div>
                  )}
                </div>
                )}
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getHealthColor(project.health)}`}>
                {getHealthIcon(project.health)}
                <span className="text-sm font-medium capitalize">{(project.health || 'on-track').replace('-', ' ')}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    project.health === 'on-track' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    project.health === 'at-risk' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                    'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Timeline</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Team Size</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">{project.team} members</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium">Budget</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  ${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium">Milestones</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  {project.milestones?.completed || 0} / {project.milestones?.total || 0}
                </p>
              </div>
            </div>

            {/* Tasks Summary */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Total</div>
                  <div className="font-semibold text-gray-900">{project.tasks?.total || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Completed</div>
                  <div className="font-semibold text-green-600">{project.tasks?.completed || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 mb-1">In Progress</div>
                  <div className="font-semibold text-blue-600">{project.tasks?.inProgress || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Blocked</div>
                  <div className="font-semibold text-red-600">{project.tasks?.blocked || 0}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              <button onClick={() => { setShowModal(false); setEditingProject(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={editingProject ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. Website Redesign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Company</label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Select a company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
                    placeholder="Project details..."
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingProject(null); }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
