import { useState, useEffect } from 'react';
import { getTaskBoard, createTask, updateTaskStatus, deleteTask } from '../../services/taskService';
import { getProjects } from '../../services/projectService';
import { getTeamMembers } from '../../services/teamService';
import {
  GripVertical,
  Plus,
  Search,
  Calendar,
  Flag,
  Paperclip,
  MessageSquare,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAdmin = currentUser.role === 'Admin';
  const isPM = currentUser.role === 'ProjectManager';
  const isMember = currentUser.role === 'Member';
  const canManageTasks = isAdmin || isPM;


  // New Task Form State
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigneeIds: [] as string[],
    endDate: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [boardData, projectData, memberData] = await Promise.all([
        getTaskBoard(),
        getProjects(),
        getTeamMembers()
      ]);
      setData(boardData);
      setProjects(projectData);
      setMembers(memberData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      const selectedMemberNames = members
        .filter(m => formData.assigneeIds.includes(m.id))
        .map(m => m.name);

      const payload = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        projectName: selectedProject?.name || '',
        status: formData.status === 'todo' ? 0 : 
                formData.status === 'in-progress' ? 1 :
                formData.status === 'blocked' ? 2 : 3,
        priority: formData.priority === 'high' ? 2 :
                  formData.priority === 'medium' ? 1 : 0,
        assigneeIds: formData.assigneeIds,
        assigneeNames: selectedMemberNames,
        startDate: new Date().toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        estimatedHours: 0,
        actualHours: 0,
        order: 0
      };

      await createTask(payload);
      setShowModal(false);
      setFormData({
        title: '',
        projectId: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        assigneeIds: [],
        endDate: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please check all fields.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
    setActiveTaskMenu(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
    setActiveTaskMenu(null);
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-500', count: data?.todo?.length || 0 },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500', count: data?.['in-progress']?.length || 0 },
    { id: 'blocked', title: 'Blocked', color: 'bg-red-500', count: data?.blocked?.length || 0 },
    { id: 'done', title: 'Done', color: 'bg-green-500', count: data?.done?.length || 0 }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  const tasks = data || { todo: [], 'in-progress': [], blocked: [], done: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Task Board</h2>
          <p className="text-gray-600">Manage tasks across all projects</p>
        </div>
        {canManageTasks && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Task
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
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option>All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option>All Assignees</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option>All Priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                  {column.count}
                </span>
              </div>
              <button
                onClick={() => {
                  setFormData({ ...formData, status: column.id });
                  setShowModal(true);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
              {(tasks[column.id] || []).filter((t: any) =>
                t.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((task: any) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-move group"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1 leading-tight">{task.title}</h4>
                      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{task.project}</p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {activeTaskMenu === task.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 w-44">
                          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Move to</div>
                          {['todo', 'in-progress', 'blocked', 'done'].filter(s => s !== column.id).map(status => (
                            <button key={status} onClick={() => handleStatusChange(task.id, status)} className="w-full px-4 py-1.5 text-left text-sm hover:bg-gray-50 text-gray-700 capitalize">{status.replace('-', ' ')}</button>
                          ))}
                          <div className="border-t border-gray-100 my-1"></div>
                          {canManageTasks && <button onClick={() => handleDeleteTask(task.id)} className="w-full px-4 py-1.5 text-left text-sm hover:bg-red-50 text-red-600">Delete Task</button>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(task.priority)}`}>
                      <Flag className="w-2.5 h-2.5" />
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {task.assignee.avatar}
                    </div>
                    <span className="text-[11px] text-gray-600 font-medium">{task.assignee.name}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${
                      isOverdue(task.dueDate) && column.id !== 'done' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(tasks[column.id] || []).length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium italic">No tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Create New Task</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Implement Login API"
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
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  multiple
                  required
                  value={formData.assigneeIds}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, assigneeIds: options });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple assignees</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
