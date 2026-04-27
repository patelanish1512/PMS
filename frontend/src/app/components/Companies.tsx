import { useState, useEffect } from 'react';
import { getCompanies, createCompany, deleteCompany, updateCompany } from '../../services/companyService';
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  FolderKanban,
  DollarSign,
  TrendingUp,
  MoreVertical,
  X,
  Loader2,
  Trash2
} from 'lucide-react';

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAdmin = currentUser.role === 'Admin';


  // Form State
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const companyData = await getCompanies();
      setCompanies(companyData);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
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
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await createCompany(formData);
      }
      setShowModal(false);
      setEditingCompany(null);
      setFormData({ name: '', industry: '', address: '', contactPerson: '', email: '', phone: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save company:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? All associated project links will be affected.')) return;
    try {
      await deleteCompany(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Calculation
  const totalBudget = companies.reduce((acc, c) => acc + (c.budget || 0), 0);
  const activeProjects = companies.reduce((acc, c) => acc + (c.projects?.active || 0), 0);
  const avgCompletion = companies.length > 0 
    ? Math.round(companies.reduce((acc, c) => acc + (c.completion || 0), 0) / companies.length)
    : 0;

  if (isLoading && companies.length === 0) {
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
          <h2 className="text-2xl font-semibold text-gray-900">Companies & Clients</h2>
          <p className="text-gray-600">Manage company information and project associations</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Company
          </button>
        )}

      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies by name, industry, or contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Companies</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{companies.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active Projects</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{activeProjects}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Portfolio</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">${(totalBudget / 1000000).toFixed(2)}M</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Avg Progress</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgCompletion}%</div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-orange-50/50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-100">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1.5">{company.name}</h3>
                    <span className="inline-flex items-center px-3 py-1 bg-white text-orange-600 text-xs font-bold uppercase tracking-wider rounded-lg border border-orange-100">
                      {company.industry}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => {
                      setEditingCompany(company);
                      setFormData({ name: company.name, industry: company.industry, address: company.address, contactPerson: company.contactPerson, email: company.email, phone: company.phone });
                      setShowModal(true);
                    }} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
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
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span>{company.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Mail className="w-4 h-4 text-orange-400" />
                    <span>{company.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Phone className="w-4 h-4 text-orange-400" />
                    <span>{company.phone}</span>
                  </div>
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Representative</div>
                    <div className="text-sm font-bold text-gray-900">{company.contactPerson}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Stats */}
            <div className="p-6 bg-gray-50/50">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active</div>
                  <div className="text-xl font-bold text-blue-600">{company.projects?.active || 0}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Done</div>
                  <div className="text-xl font-bold text-green-600">{company.projects?.completed || 0}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total</div>
                  <div className="text-xl font-bold text-gray-900">{company.projects?.total || 0}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project Value</span>
                  <span className="text-sm font-bold text-gray-900">${((company.budget || 0) / 1000).toFixed(0)}k</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Average Completion</span>
                    <span className="text-orange-600">{company.completion || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-sm"
                      style={{ width: `${company.completion || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredCompanies.length === 0 && (
          <div className="lg:col-span-2 py-20 text-center text-gray-400 italic font-medium bg-white rounded-2xl border border-dashed border-gray-200">
            No companies found matching your search
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add New Client</h3>
                <p className="text-sm text-gray-500 font-medium">Create a new company profile</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Industry</label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="e.g. Technology"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Office Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                  placeholder="Street, City, Country"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    placeholder="+1 (000) 000-0000"
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
                  Register Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
