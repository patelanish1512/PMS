import { useState, useEffect } from 'react';
import { getTimeLogs, createTimeLog, deleteTimeLog, approveTimeLog, rejectTimeLog } from '../../services/timeLogService';
import { getProjects } from '../../services/projectService';
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
  X,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TimeTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');

  // Timer Form State
  const [timerProject, setTimerProject] = useState('');
  const [timerTask, setTimerTask] = useState('');

  // Manual Log Form State
  const [formData, setFormData] = useState({
    projectId: '',
    taskName: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logData, projectData] = await Promise.all([
        getTimeLogs(),
        getProjects()
      ]);
      setLogs(logData);
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

  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleStopTimer = async () => {
    if (elapsedTime < 60) {
      if (!confirm('Timer is less than a minute. Are you sure you want to stop and discard?')) return;
      setIsTracking(false);
      setElapsedTime(0);
      return;
    }

    setIsTracking(false);
    const hours = +(elapsedTime / 3600).toFixed(2);
    const selectedProject = projects.find(p => p.id === timerProject);

    try {
      await createTimeLog({
        projectId: timerProject,
        projectName: selectedProject?.name || 'Unknown',
        taskName: timerTask || 'Untitled Task',
        hoursSpent: hours,
        logDate: new Date().toISOString(),
        userId: currentUser.email || 'admin',
        userName: currentUser.fullName || 'Admin User',
        status: 'approved',
        description: 'Recorded via timer'
      });
      setElapsedTime(0);
      setTimerTask('');
      fetchData();
    } catch (error) {
      console.error('Failed to save time log:', error);
      alert('Failed to save timer entry.');
    }
  };

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      await createTimeLog({
        projectId: formData.projectId,
        projectName: selectedProject?.name || 'Unknown',
        taskName: formData.taskName,
        hoursSpent: formData.hours === '' ? 0 : parseFloat(formData.hours),
        logDate: new Date(formData.date).toISOString(),

        userId: currentUser.email || 'admin',
        userName: currentUser.fullName || 'Admin User',
        status: 'approved',
        description: formData.description
      });
      setShowModal(false);
      setFormData({
        projectId: '',
        taskName: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to log time:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats Calculation
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === today);
  const totalToday = todayLogs.reduce((acc, l) => acc + l.hours, 0);

  const activeProjectsCount = new Set(logs.map(l => l.project)).size;

  const weeklyData = [
    { day: 'Mon', hours: 0, target: 8 },
    { day: 'Tue', hours: 0, target: 8 },
    { day: 'Wed', hours: 0, target: 8 },
    { day: 'Thu', hours: 0, target: 8 },
    { day: 'Fri', hours: 0, target: 8 },
    { day: 'Sat', hours: 0, target: 8 },
    { day: 'Sun', hours: 0, target: 8 }
  ];

  // Simple project hours map for progress bars
  const projectHours = logs.reduce((acc: any, log) => {
    acc[log.project] = (acc[log.project] || 0) + log.hours;
    return acc;
  }, {});

  if (isLoading && logs.length === 0) {
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
          <h2 className="text-2xl font-semibold text-gray-900">Time Tracking</h2>
          <p className="text-gray-600">Log and monitor work hours across projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg transition-colors shadow-sm">
            <Download className="w-5 h-5" />
            Export Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
            Log Time
          </button>
        </div>
      </div>

      {/* Time Tracker Widget */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl shadow-orange-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2 opacity-90">Active Timer</h3>
            <div className="text-6xl font-mono font-bold mb-6 tracking-tighter">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex items-center gap-4">
              {!isTracking ? (
                <button
                  onClick={() => {
                    if (!timerProject) return alert('Please select a project first');
                    setIsTracking(true);
                  }}
                  className="flex items-center gap-2 bg-white text-orange-600 px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Timer
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsTracking(false)}
                    className="flex items-center gap-2 bg-white text-orange-600 px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                  >
                    <Pause className="w-5 h-5 fill-current" />
                    Pause
                  </button>
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center gap-2 bg-white/20 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/30 transition-all border border-white/30"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    Stop & Save
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 min-w-[320px] border border-white/20">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5 block">Select Project</label>
                <select
                  value={timerProject}
                  disabled={isTracking}
                  onChange={(e) => setTimerProject(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer"
                >
                  <option value="" className="text-gray-900">Choose Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5 block">What are you working on?</label>
                <input
                  type="text"
                  value={timerTask}
                  onChange={(e) => setTimerTask(e.target.value)}
                  placeholder="Task description..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{totalToday.toFixed(1)} hrs</div>
          <div className="text-xs text-gray-500 mt-1">of 8.0 hrs target</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Total Entries</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{logs.length}</div>
          <div className="text-xs text-gray-500 mt-1">All time records</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600">Avg Daily</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{(logs.reduce((a,b)=>a+b.hours, 0) / (logs.length || 1)).toFixed(1)} hrs</div>
          <div className="text-xs text-gray-500 mt-1">based on all entries</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderKanban className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Active Projects</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{activeProjectsCount}</div>
          <div className="text-xs text-gray-500 mt-1">projects with time logged</div>
        </div>
      </div>

      {/* Project Breakdown */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Hours by Project</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {Object.entries(projectHours).map(([name, hours]: [string, any], index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">{name}</span>
                <span className="text-sm font-bold text-orange-600">{hours.toFixed(1)} hrs</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-200"
                  style={{ width: `${Math.min((hours / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(projectHours).length === 0 && <p className="text-sm text-gray-400 italic">No project data yet</p>}
        </div>
      </div>

      {/* Recent Time Entries */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Project</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Task</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Hours</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-gray-900">{entry.project}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{entry.task}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{entry.user}</td>
                  <td className="py-4 px-4 text-sm font-bold text-gray-900 text-right">
                    {entry.hours.toFixed(1)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${entry.status === 'approved' ? 'bg-green-100 text-green-700' : entry.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {(currentUser.role === 'Admin' || currentUser.role === 'ProjectManager') && entry.status !== 'approved' && (
                        <button onClick={async () => { await approveTimeLog(entry.id); fetchData(); }} className="px-2 py-1 text-[10px] font-bold text-green-700 bg-green-50 rounded hover:bg-green-100">Approve</button>
                      )}
                      {(currentUser.role === 'Admin' || currentUser.role === 'ProjectManager') && entry.status !== 'rejected' && (
                        <button onClick={async () => { await rejectTimeLog(entry.id); fetchData(); }} className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-50 rounded hover:bg-red-100">Reject</button>
                      )}
                      {(currentUser.role === 'Admin' || currentUser.role === 'ProjectManager') && (
                        <button onClick={async () => { if (confirm('Delete this entry?')) { await deleteTimeLog(entry.id); fetchData(); }}} className="px-2 py-1 text-[10px] font-bold text-gray-700 bg-gray-50 rounded hover:bg-gray-100">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400 italic">No time logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Log Time Manually</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleManualLog} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input
                  type="text"
                  required
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Code Review"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. 2.5"
                  />

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
                  placeholder="What did you achieve?"
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
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
