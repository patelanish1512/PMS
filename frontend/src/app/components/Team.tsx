import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, updateUserStatus } from '../../services/userService';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  CheckSquare,
  Clock,
  MoreVertical,
  Shield,
  User,
  X,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function Team() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAdmin = currentUser.role === 'Admin';


  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    location: '',
    role: 2, // Member by default (from Enum)
    password: 'Password123!' // Default password for new members
  });


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createUser(formData);
      setShowModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        location: '',
        role: 2,
        password: 'Password123!'
      });

      fetchData();
    } catch (error) {
      console.error('Failed to create team member:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member? This action cannot be undone.')) return;
    try {
      await deleteUser(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(id, newStatus);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'ProjectManager':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Member':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Client':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-3 h-3" />;
      case 'ProjectManager':
        return <Users className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'ProjectManager') return 'Project Manager';
    return role;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return 'text-red-600';
    if (utilization > 75) return 'text-amber-600';
    if (utilization > 50) return 'text-green-600';
    return 'text-blue-600';
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    avgUtilization: members.length > 0 
      ? Math.round(members.reduce((sum, m) => sum + (m.utilization || 0), 0) / members.length)
      : 0,
    totalHours: members.reduce((sum, m) => sum + (m.hoursThisWeek || 0), 0)
  };

  if (isLoading && members.length === 0) {
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
          <h2 className="text-2xl font-semibold text-gray-900">Team Members</h2>
          <p className="text-gray-600">Manage team members and their assignments</p>
        </div>
        {(isAdmin || currentUser.role === 'ProjectManager') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Team Member
          </button>
        )}

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Members</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active Now</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Hours (Week)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderKanban className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Avg Utilization</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.avgUtilization}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-medium"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-6 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold text-gray-600 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="ProjectManager">Project Manager</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group shadow-sm ${member.status === 'inactive' ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-orange-50/50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-100 relative">
                    {member.avatar}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-sm font-medium text-gray-500 mb-2.5">{member.designation}</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getRoleBadge(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleStatus(member.id, member.status)}
                      className={`p-2 rounded-xl transition-all ${member.status === 'active' ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'}`}
                      title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-all text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 border-b border-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Mail className="w-4 h-4 text-orange-400" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Phone className="w-4 h-4 text-orange-400" />
                    <span>{member.phone || 'No phone'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span>{member.location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span>{member.department || 'General'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 bg-gray-50/50">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Projects</div>
                  <div className="text-2xl font-bold text-gray-900">{member.activeProjects}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weekly Hours</div>
                  <div className="text-2xl font-bold text-gray-900">{member.hoursThisWeek?.toFixed(1)} <span className="text-xs text-gray-400">hrs</span></div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  <span>Task Completion Rate</span>
                  <span className="text-gray-900">
                    {member.tasksCompleted} / {member.tasksAssigned} Done
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-sm"
                    style={{ width: `${member.tasksAssigned > 0 ? (member.tasksCompleted / member.tasksAssigned) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Team Utilization</span>
                <span className={`text-xl font-bold ${getUtilizationColor(member.utilization)}`}>
                  {member.utilization}%
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="lg:col-span-2 py-20 text-center text-gray-400 italic font-medium bg-white rounded-2xl border border-dashed border-gray-200">
            No team members found matching your search
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">New Team Member</h3>
                <p className="text-sm text-gray-500 font-medium">Add a new professional to the workspace</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="e.g. Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value === '' ? 2 : parseInt(e.target.value) })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-600"
                  >
                    <option value={2}>Member</option>
                    <option value={3}>Client</option>
                    {isAdmin && <option value={1}>Project Manager</option>}
                    {isAdmin && <option value={0}>Admin</option>}
                  </select>



                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
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
                  disabled={isSaving}
                  className="px-10 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-orange-100 disabled:opacity-50 flex items-center gap-2 active:scale-95"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
