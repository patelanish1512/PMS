import { useState, useEffect } from 'react';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../../services/milestoneService';
import { getProjects } from '../../services/projectService';
import { Plus, Search, Target, Calendar, FolderKanban, CheckCircle2, AlertCircle, Clock, X, Loader2 } from 'lucide-react';

export default function Milestones() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);

  // New Milestone Form State
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    description: '',
    dueDate: '',
    status: 'planned',
    priority: 'medium'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
      const [milestoneData, projectData] = await Promise.all([
        currentUser.role === 'Client' ? import('../../services/milestoneService').then(m => m.getClientMilestones()) : getMilestones(),
        currentUser.role === 'Client' ? import('../../services/projectService').then(m => m.getClientProjects()) : getProjects()
      ]);
      setMilestones(milestoneData);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      const payload = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        projectName: selectedProject?.name || '',
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        progress: 0,
        priority: formData.priority === 'critical' ? 3 :
                  formData.priority === 'high' ? 2 :
                  formData.priority === 'medium' ? 1 : 0
      };

      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, payload);
      } else {
        await createMilestone(payload);
      }
      setShowModal(false);
      setEditingMilestone(null);
      setFormData({
        title: '',
        projectId: '',
        description: '',
        dueDate: '',
        status: 'planned',
        priority: 'medium'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save milestone:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'at-risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'at-risk':
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const canManageMilestones = currentUser.role === 'Admin' || currentUser.role === 'ProjectManager';

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         milestone.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || milestone.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status.toLowerCase() === 'completed').length,
    inProgress: milestones.filter(m => m.status.toLowerCase() === 'in-progress').length,
    overdue: milestones.filter(m => m.status.toLowerCase() === 'overdue').length
  };

  if (isLoading && milestones.length === 0) {
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
          <h2 className="text-2xl font-semibold text-gray-900">Milestones</h2>
          <p className="text-gray-600">Track project milestones and key deliverables</p>
        </div>
        {canManageMilestones && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
            New Milestone
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Total Milestones</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{stats.inProgress}</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{stats.completed}</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{stats.overdue}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search milestones..."
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
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="at-risk">At Risk</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMilestones.map((milestone) => (
          <div key={milestone.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    milestone.status.toLowerCase() === 'completed' ? 'bg-green-100' :
                    milestone.status.toLowerCase() === 'overdue' ? 'bg-red-100' :
                    milestone.status.toLowerCase() === 'at-risk' ? 'bg-amber-100' :
                    'bg-blue-100'
                  }`}>
                    <Target className={`w-5 h-5 ${
                      milestone.status.toLowerCase() === 'completed' ? 'text-green-600' :
                      milestone.status.toLowerCase() === 'overdue' ? 'text-red-600' :
                      milestone.status.toLowerCase() === 'at-risk' ? 'text-amber-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{milestone.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FolderKanban className="w-4 h-4" />
                      <span>{milestone.project}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase ${getPriorityColor(milestone.priority)}`}>
                  {milestone.priority}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{milestone.description}</p>

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border ${getStatusColor(milestone.status)}`}>
                  {getStatusIcon(milestone.status)}
                  {milestone.status.replace('-', ' ')}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(milestone.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-gray-900">{milestone.completion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                <div
                  className={`h-2.5 rounded-full ${
                    milestone.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                    milestone.status.toLowerCase() === 'overdue' ? 'bg-red-500' :
                    milestone.status.toLowerCase() === 'at-risk' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${milestone.completion}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Tasks: {milestone.tasks?.completed || 0} / {milestone.tasks?.total || 0} completed</span>
              </div>
            </div>

            {/* Assignees */}
            <div className="p-6">
              <div className="text-xs font-medium text-gray-600 mb-2">Assigned To</div>
              <div className="flex items-center gap-2">
                {(milestone.assignees || []).map((assignee: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {assignee.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="text-sm text-gray-900">{assignee}</span>
                  </div>
                ))}
                {(milestone.assignees || []).length === 0 && <span className="text-xs text-gray-400 italic">No assignees</span>}
              </div>
            </div>

            {/* Actions */}
            {canManageMilestones && (
              <div className="px-6 pb-4 flex items-center gap-2">
                <button onClick={() => {
                  setEditingMilestone(milestone);
                  setFormData({ title: milestone.title, projectId: '', description: milestone.description || '', dueDate: milestone.dueDate, status: milestone.status, priority: milestone.priority });
                  setShowModal(true);
                }} className="px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">Edit</button>
                <button onClick={async () => { if (confirm('Delete this milestone?')) { await deleteMilestone(milestone.id); fetchData(); }}} className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Milestone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">{editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}</h3>
              <button onClick={() => { setShowModal(false); setEditingMilestone(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Phase 1 Completion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    required
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
                  placeholder="Milestone details..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
